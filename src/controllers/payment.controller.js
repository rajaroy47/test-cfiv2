import crypto from "crypto";
import mongoose from "mongoose";
import { UAParser } from "ua-parser-js";

import RazorpaInstance from "../config/razorpay.js";
import Service from "../models/service.model.js";
import Order from "../models/order.model.js";
import Payment from "../models/payment.model.js";
import ServicePlan from "../models/servicePlan.model.js";
import ServiceStatus from "../models/serviceStatus.model.js";


// ─────────────────────────────────────────────
// Helper: Extract device/browser metadata from request
// ─────────────────────────────────────────────
const getRequestMetadata = (req) => {
  const ua = UAParser(req.headers["user-agent"]);

  // Handles proxies like Cloudflare / Nginx
  const ipAddress =
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.socket.remoteAddress ||
    req.ip;

  return {
    ipAddress,
    browser: ua.browser.name || "Unknown",
    browserVersion: ua.browser.version || "Unknown",
    os: ua.os.name || "Unknown",
    device: ua.device.type || "desktop",
    userAgent: req.headers["user-agent"],
  };
};


// ─────────────────────────────────────────────
// Helper: Safely compute finalPrice from a plan tier
// Used as a safety net if the DB record is missing finalPrice
// ─────────────────────────────────────────────
const computeFinalPrice = (selectedPlan) => {
  // Use stored finalPrice if available
  if (selectedPlan.finalPrice !== undefined && selectedPlan.finalPrice !== null) {
    return Number(selectedPlan.finalPrice);
  }

  // Fallback: calculate on the fly for old records missing finalPrice
  const basePrice = Number(selectedPlan.price || 0);
  const discount = Number(selectedPlan.discount || 0);
  return Math.max(0, basePrice - discount);
};


// ─────────────────────────────────────────────
// POST /payment/process
// Creates a Razorpay order and a local pending Order document.
// If a stale pending order exists with a different price (e.g. plan was updated),
// it is deleted and a fresh order is created with the latest price.
// ─────────────────────────────────────────────
export const processPayment = async (req, res) => {
  try {
    const { serviceId, plan } = req.body;

    // 1. Validate required fields
    if (!serviceId || !plan) {
      return res.status(400).json({
        success: false,
        message: "Service ID and plan are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid service ID",
      });
    }

    // 2. Verify the service exists
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    // 3. Verify the service plan exists
    const servicePlan = await ServicePlan.findOne({ serviceId });
    if (!servicePlan) {
      return res.status(404).json({
        success: false,
        message: "Service plan not found",
      });
    }

    // 4. Verify the requested tier (basic / standard / premium) exists
    const selectedPlan = servicePlan?.plans?.[plan];
    if (!selectedPlan) {
      return res.status(404).json({
        success: false,
        message: `${plan} plan not found`,
      });
    }

    // 5. Resolve the latest final amount from the plan
    // This always reads the current DB value so price updates are reflected immediately
    const amount = computeFinalPrice(selectedPlan);

    // console.log("Final Checkout Amount: ₹", amount);

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid plan amount",
      });
    }

    // 6. Check for an existing pending order for this user + service + plan
    const existingPendingOrder = await Order.findOne({
      user: req.user._id,
      service: serviceId,
      plan,
      orderStatus: "pending",
    });

    if (existingPendingOrder) {
      if (existingPendingOrder.amount === amount) {
        // ✅ Price hasn't changed — safely reuse the existing Razorpay order
        return res.status(200).json({
          success: true,
          orderId: existingPendingOrder.razorpayOrderId,
          amount: existingPendingOrder.amount * 100,
          dbOrderId: existingPendingOrder._id,
          message: "Pending order already exists",
        });
      } else {
        // 🔄 Price has changed since the pending order was created (plan was updated).
        // Delete the stale order so a fresh one is created below with the correct price.
        console.log(
          `Stale pending order detected. Old price: ₹${existingPendingOrder.amount}, New price: ₹${amount}. Replacing...`
        );
        await Order.findByIdAndDelete(existingPendingOrder._id);
      }
    }

    // 7. Create a new Razorpay order with the current amount
    const razorpayOrder = await RazorpaInstance.orders.create({
      amount: Math.round(amount * 100), // Razorpay expects paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        userId: req.user._id.toString(),
        serviceId,
        plan,
      },
    });

    // 8. Persist the new order in the local database
    const order = await Order.create({
      user: req.user._id,
      service: serviceId,
      plan,
      amount,
      planFeatures: selectedPlan.features || [],
      razorpayOrderId: razorpayOrder.id,
      orderStatus: "pending",
    });

    return res.status(201).json({
      success: true,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      dbOrderId: order._id,
      message: "Payment order created successfully",
    });

  } catch (error) {
    console.error("Process Payment Error:", error);

    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "production"
          ? "Something went wrong"
          : error.message,
    });
  }
};


// ─────────────────────────────────────────────
// POST /payment/verify
// Verifies Razorpay signature, logs payment, marks order complete,
// and creates a ServiceStatus entry — all inside a single transaction.
// ─────────────────────────────────────────────
export const verifyPayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // 1. Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "Invalid request. All fields are required.",
      });
    }

    // 2. Verify Razorpay signature authenticity
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "Payment verification failed. Invalid signature.",
      });
    }

    // 3. Find the matching order
    const order = await Order.findOne({ razorpayOrderId: razorpay_order_id }).session(session);

    if (!order) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // 4. Idempotency check — prevent double-processing the same payment
    const existingPayment = await Payment.findOne({
      razorpayPaymentId: razorpay_payment_id,
    }).session(session);

    if (existingPayment) {
      await session.abortTransaction();
      session.endSession();
      return res.status(200).json({
        success: true,
        message: "Payment already verified",
        paymentId: existingPayment._id,
        orderId: order._id,
      });
    }

    const clientMetadata = getRequestMetadata(req);

    // 5. Create the payment log entry
    const [payment] = await Payment.create(
      [
        {
          user: order.user,
          service: order.service,
          order: order._id,
          plan: order.plan,
          amount: order.amount,
          paymentMethod: "razorpay",
          paymentStatus: "completed",
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          paidAt: new Date(),
          metadata: clientMetadata,
        },
      ],
      { session }
    );

    // 6. Mark the parent order as completed
    order.paymentId = payment._id;
    order.razorpayPaymentId = razorpay_payment_id;
    order.signature = razorpay_signature;
    order.orderStatus = "completed";
    await order.save({ session });

    // 7. Create a ServiceStatus entry if one doesn't already exist
    const existingServiceStatus = await ServiceStatus.findOne({
      serviceId: order.service,
      subscribedBy: order.user,
    }).session(session);

    if (!existingServiceStatus) {
      await ServiceStatus.create(
        [
          {
            serviceId: order.service,
            subscribedBy: order.user,
            status: "processing",
          },
        ],
        { session }
      );
    }

    // 8. Commit all writes atomically
    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      paymentId: payment._id,
      orderId: order._id,
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error("Verification error context:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error during verification",
    });
  }
};


// ─────────────────────────────────────────────
// GET /payment/key
// Returns the public Razorpay key ID for frontend initialisation
// ─────────────────────────────────────────────
export const getRazorpayKey = (req, res) => {
  return res.status(200).json({
    success: true,
    key: process.env.RAZORPAY_KEY_ID,
  });
};


// ─────────────────────────────────────────────
// GET /payment/success
// Simple success acknowledgement endpoint
// ─────────────────────────────────────────────
export const getSuccessMsg = (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Payment successful",
  });
};


// ─────────────────────────────────────────────
// GET /payment/my-payments
// Returns all payments made by the authenticated user
// ─────────────────────────────────────────────
export const getMyPaymentDetails = async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user._id })
      .populate("service", "name slug")
      .populate("order", "plan");

    if (!payments || payments.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No payments found",
      });
    }

    return res.status(200).json({
      success: true,
      payments,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};