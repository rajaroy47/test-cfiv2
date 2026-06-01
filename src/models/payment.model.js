import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    service: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Service",
        required: true
    },
    plan: {
        type: String,
        enum: ["basic", "standard", "premium"],
        required: true
    },
    amount: {
        type: Number,
        min: 1,
        required: true
    },
    paymentMethod: {
        type: String,
        enum: ["razorpay", "debit_card", "credit_card", "net_banking", "upi"],
        default: "razorpay"
    },
    paymentStatus: {
        type: String,
        enum: ["pending", "completed", "failed"],
        default: "pending"
    }
}, { timestamps: true });

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;