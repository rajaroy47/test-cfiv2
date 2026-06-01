import crypto from "crypto";
import RazorpaInstance from "../config/razorpay.js";


export const processPayment = async (req, res) => {
    try {
        const { amount } = req.body;
        const options = {
            amount: amount * 100, // Amount in paise
            currency: "INR",
        };

        const order = await RazorpaInstance.orders.create(options);
        res.status(200).json(order);
        console.log("Payment processed successfully:", order);
    } catch (error) {
        console.error("Error processing payment:", error);
        res.status(500).json({ error: "Failed to process payment" });
    }
};

export const verifyPayment = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
        } = req.body;

        const body =
            razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac(
                "sha256",
                process.env.RAZORPAY_KEY_SECRET
            )
            .update(body.toString())
            .digest("hex");

        const isAuthentic =
            expectedSignature === razorpay_signature;

        if (!isAuthentic) {
            return res.status(400).json({
                success: false,
                message: "Payment verification failed",
            });
        }

        // Save payment in DB here

        return res.status(200).json({
            success: true,
            message: "Payment verified successfully",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const getRazorpayKey = (req, res) => {
    res.status(200).json({ key: process.env.RAZORPAY_KEY_ID });
};

export const getSuccessMsg = (req, res) => {
    res.status(200).json({ message: "Payment successful" });
};