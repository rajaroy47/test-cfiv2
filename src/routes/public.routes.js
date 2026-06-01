import express from "express";

import { getAllServices, getServiceBySlug } from "../controllers/service.controller.js";
import { getServicePlans, getServicePlanByServiceId } from "../controllers/servicePlan.controller.js";
import { processPayment, getRazorpayKey, getSuccessMsg, verifyPayment } from "../controllers/payment.controller.js";

const router = express.Router();

// services
router.get("/services", getAllServices);
router.get("/services/:slug", getServiceBySlug);

// service plans
router.get("/service-plans", getServicePlans);
router.get("/service-plans/:serviceId", getServicePlanByServiceId);

router.post("/payment/process", processPayment);
router.get("/payment/key", getRazorpayKey);
router.post("/payment/verify", verifyPayment);
router.post("/payment/success", getSuccessMsg);

export default router;