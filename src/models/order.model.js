import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
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
    orderStatus: {  
        type: String,
        enum: ["pending", "completed", "cancelled"],
        default: "pending"
    },
    paymentId: {
        type: String,
        unique: true
    },
    razorpayOrderId: {
        type: String,
        unique: true
    },
    signature: {
        type: String,
        unique: true
    },
    razorpayPaymentId: {
        type: String,
        unique: true
    }

}, { timestamps: true });

export default mongoose.model("Order", orderSchema);

export default Order;