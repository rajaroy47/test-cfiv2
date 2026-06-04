import express from "express";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import { getUserProfile, updateUserProfile } from "../controllers/user.controller.js";
import { getMyOrders } from "../controllers/order.controller.js";
import { getMyPaymentDetails, getRazorpayKey, getSuccessMsg, processPayment, verifyPayment } from "../controllers/payment.controller.js";



const router = express.Router();

router.get("/profile", isAuthenticated, getUserProfile);
router.put("/profile", isAuthenticated, updateUserProfile);

// orders
router.get("/my-orders", isAuthenticated, getMyOrders);

router.post("/payment/process", isAuthenticated, processPayment);
router.get("/payment/key", isAuthenticated, getRazorpayKey); // should be protected
router.post("/payment/verify", isAuthenticated, verifyPayment);
router.post("/payment/success", isAuthenticated, getSuccessMsg);

// payments
router.get("/my-payments", isAuthenticated, getMyPaymentDetails);

export default router;

