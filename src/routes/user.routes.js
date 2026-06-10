import express from "express";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import { getUserProfile, updateUserProfile } from "../controllers/user.controller.js";
import { getMyOrders } from "../controllers/order.controller.js";
import { getMyPaymentDetails, getRazorpayKey, getSuccessMsg, processPayment, verifyPayment } from "../controllers/payment.controller.js";

import { upload } from "../middlewares/upload.middleware.js";
import { getServiceStatus } from "../controllers/serviceStatus.controller.js";



const router = express.Router();

router.get("/profile", isAuthenticated, getUserProfile);
router.put("/profile", isAuthenticated, upload.single("avatar"), updateUserProfile);

// orders
router.get("/my-orders", isAuthenticated, getMyOrders);

router.post("/payment/process", isAuthenticated, processPayment);
router.get("/payment/key", isAuthenticated, getRazorpayKey); // should be protected
router.post("/payment/verify", isAuthenticated, verifyPayment);
router.post("/payment/success", isAuthenticated, getSuccessMsg);

// payments
router.get("/my-payments", isAuthenticated, getMyPaymentDetails);

// serviceStatus
router.get("/service-status/:serviceId", isAuthenticated, getServiceStatus);


export default router;

