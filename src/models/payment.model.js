import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
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

    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
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

    paymentMethod: {
      type: String,
      enum: [
        "razorpay",
        "debit_card",
        "credit_card",
        "net_banking",
        "upi",
      ],
      default: "razorpay",
    },

    paymentStatus: {
      type: String,
      enum: [
        "pending",
        "completed",
        "failed",
        "refunded",
      ],
      default: "pending",
    },

    razorpayOrderId: {
      type: String,
      required: true,
      trim: true,
    },

    razorpayPaymentId: {
      type: String,
      default: null,
      trim: true,
    },

    razorpaySignature: {
      type: String,
      default: null,
      trim: true,
    },

    paidAt: {
      type: Date,
      default: null,
    },

    metadata: {
      ipAddress: {
        type: String,
        required: true,
      },
      browser: {
        type: String,
        required: true,
      },
      browserVersion: {
        type: String,
        required: true,
      },
      os: {
        type: String,
        required: true,
      },
      device: {
        type: String,
        required: true,
      },
      userAgent: {
        type: String,
        required: true,
      },
    },

    failureReason: {
      type: String,
      default: null,
      trim: true,
    },

    refundAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    refundedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ user: 1 });
paymentSchema.index({ service: 1 });
paymentSchema.index({ order: 1 });
paymentSchema.index({ paymentStatus: 1 });
paymentSchema.index({ razorpayOrderId: 1 });
paymentSchema.index({ razorpayPaymentId: 1 });

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;