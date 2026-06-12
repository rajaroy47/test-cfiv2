import express from "express";

import { getAllServices, getServiceBySlug } from "../controllers/service.controller.js";
import { getServicePlans, getServicePlanByServiceId } from "../controllers/servicePlan.controller.js";
import { processPayment, getRazorpayKey, getSuccessMsg, verifyPayment } from "../controllers/payment.controller.js";

import { getAllArticles, getArticleBySlug, getArticleById, getRelatedArticles, getArticleLikes } from "../controllers/article.controller.js";


const router = express.Router();


router.get("/services", getAllServices);
router.get("/services/:slug", getServiceBySlug);

router.get("/service-plans", getServicePlans);
router.get("/service-plans/:serviceId", getServicePlanByServiceId);

router.get("/articles", getAllArticles);
router.get("/articles/slug/:slug", getArticleBySlug);
router.get("/articles/:id/related", getRelatedArticles);
router.get("/articles/:id", getArticleById);

// get article like
router.get("/article/:id/likes", getArticleLikes);


export default router;