import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },

    plan: {
      type: String,
      enum: ["basic", "standard", "premium"],
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 1,
    },

    planFeatures: {
        type: [String],
        required: true
    },

    orderStatus: {
      type: String,
      enum: ["pending", "processing", "completed", "cancelled"],
      default: "pending",
    },

    // ⚡ FIX 1: Remove "unique: true" from here directly so Mongoose doesn't misbehave
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      unique: true,
      sparse: true
      // default: null,
    },

    razorpayOrderId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    razorpayPaymentId: {
      type: String,
      default: null,
      trim: true,
    },

    signature: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Standard indexes
orderSchema.index({ user: 1 });
orderSchema.index({ service: 1 });
orderSchema.index({ orderStatus: 1 });

const Order = mongoose.model("Order", orderSchema);

export default Order;