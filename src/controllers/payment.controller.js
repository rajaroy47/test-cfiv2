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
    const { serviceId, plan, amount } = req.body;

    if (!serviceId || !plan || !amount) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const service = await Service.findById(serviceId);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    const razorpayOrder = await RazorpaInstance.orders.create({
      amount: Number(amount) * 100,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    });

    const servicePlan = await ServicePlan.findOne({ serviceId });

    const order = await Order.create({
      user: "6a1d2566758b23e44bbde9ab", // Tested static ID
      service: serviceId,
      plan,
      amount,
      planFeatures: servicePlan.plans[plan].features,
      razorpayOrderId: razorpayOrder.id,
      orderStatus: "pending",
    });

    return res.status(200).json({
      success: true,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      dbOrderId: order._id,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message,
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