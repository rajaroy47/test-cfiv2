import crypto from "crypto";
import mongoose from "mongoose"; // ⚡ FIXED: Added missing mongoose import for sessions
import { UAParser } from "ua-parser-js";

import RazorpaInstance from "../config/razorpay.js";
import Service from "../models/service.model.js";
import Order from "../models/order.model.js";
import Payment from "../models/payment.model.js";
import ServicePlan from "../models/servicePlan.model.js";


const getRequestMetadata = (req) => {
  const ua = UAParser(req.headers["user-agent"]);
  
  // Get IP address (handles proxies like Cloudflare/Nginx if applicable)
  const ipAddress = 
    req.headers["x-forwarded-for"]?.split(",")[0] || 
    req.socket.remoteAddress || 
    req.ip;

  return {
    ipAddress,
    browser: ua.browser.name || "Unknown",
    browserVersion: ua.browser.version || "Unknown",
    os: ua.os.name || "Unknown",
    device: ua.device.type || "desktop", // defaults to desktop if empty
    userAgent: req.headers["user-agent"]
  };
};

export const processPayment = async (req, res) => {
  try {
    const { serviceId, plan } = req.body;

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

    // const allowedPlans = [
    //   "basic",
    //   "standard",
    //   "premium",
    // ];

    // if (!allowedPlans.includes(plan)) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Invalid plan selected",
    //   });
    // }

    const service = await Service.findById(serviceId);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    const servicePlan = await ServicePlan.findOne({
      serviceId,
    });

    if (!servicePlan) {
      return res.status(404).json({
        success: false,
        message: "Service plan not found",
      });
    }

    const selectedPlan = servicePlan?.plans?.[plan];

    if (!selectedPlan) {
      return res.status(404).json({
        success: false,
        message: `${plan} plan not found`,
      });
    }

    const amount = Number(selectedPlan.price);

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid plan amount",
      });
    }

    const existingPendingOrder =
      await Order.findOne({
        user: req.user._id,
        service: serviceId,
        plan,
        orderStatus: "pending",
      });

    if (existingPendingOrder) {
      return res.status(200).json({
        success: true,
        orderId:
          existingPendingOrder.razorpayOrderId,
        amount:
          existingPendingOrder.amount * 100,
        dbOrderId:
          existingPendingOrder._id,
        message:
          "Pending order already exists",
      });
    }

    const razorpayOrder =
      await RazorpaInstance.orders.create({
        amount: Math.round(amount * 100),
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
        notes: {
          userId: req.user._id.toString(),
          serviceId,
          plan,
        },
      });

    const order = await Order.create({
      user: req.user._id,
      service: serviceId,
      plan,
      amount,
      planFeatures:
        selectedPlan.features || [],
      razorpayOrderId:
        razorpayOrder.id,
      orderStatus: "pending",
    });

    return res.status(201).json({
      success: true,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      dbOrderId: order._id,
      message:
        "Payment order created successfully",
    });

  } catch (error) {
    console.error(
      "Process Payment Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV ===
        "production"
          ? "Something went wrong"
          : error.message,
    });
  }
};

export const verifyPayment = async (req, res) => {
  // Start a Mongoose session for atomicity
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // 1. Validate Input Fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "Invalid request. All fields are required.",
      });
    }

    // 2. Verify Razorpay Signature Authenticity
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const isAuthentic = generatedSignature === razorpay_signature;

    if (!isAuthentic) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "Payment verification failed. Invalid signature.",
      });
    }

    // 3. Find the matching Pending Order
    const order = await Order.findOne({ razorpayOrderId: razorpay_order_id }).session(session);

    if (!order) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // 4. Idempotency Check
    const existingPayment = await Payment.findOne({ razorpayPaymentId: razorpay_payment_id }).session(session);

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

    // 5. Create Payment Log Entry
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
          metadata: clientMetadata 
        },
      ],
      { session }
    );

    // 6. Complete and Sync Parent Order Records
    order.paymentId = payment._id;
    order.razorpayPaymentId = razorpay_payment_id;
    order.signature = razorpay_signature;
    order.orderStatus = "completed";

    await order.save({ session });

    // Commit all changes across both collections simultaneously
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

export const getRazorpayKey = (req, res) => {
  return res.status(200).json({
    success: true,
    key: process.env.RAZORPAY_KEY_ID,
  });
};

export const getSuccessMsg = (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Payment successful",
  });
};

export const getMyPaymentDetails = async (req, res) => {
  try {
    console.log(req.user)
    const payments = await Payment.find({ user: req.user._id })
      .populate("service", "name slug")
      .populate("order", "plan")


    if (!payments) {
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


