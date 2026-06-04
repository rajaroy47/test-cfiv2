import express from "express";

import { isAuthenticated, isAdmin } from "../middlewares/auth.middleware.js";
import { getAllUsers, blockUser, unblockUser, deleteUser } from "../controllers/admin.controller.js";

import { createService, getAllServices, getServiceBySlug, getServicesByCategory, updateService, deleteService } from "../controllers/service.controller.js";

import { getServicePlans, createServicePlan, getServicePlanByServiceId, updateServicePlan, deleteServicePlan } from "../controllers/servicePlan.controller.js";

import { getOrderDetails } from "../controllers/order.controller.js";

import { updateWebsiteSettings, getWebsiteSettings } from "../controllers/websiteSetting.controller.js";

import { createArticle, getAllArticles, getArticleBySlug, getArticleById, updateArticle, deleteArticle, getRelatedArticles} from "../controllers/article.controller.js";


const router = express.Router();


router.get("/users", isAuthenticated, isAdmin, getAllUsers);
router.put("/users/:id/block", isAuthenticated, isAdmin, blockUser);
router.put("/users/:id/unblock", isAuthenticated, isAdmin, unblockUser);
router.delete("/users/:id", isAuthenticated, isAdmin, deleteUser);

router.post("/services", isAuthenticated, isAdmin, createService);
router.get("/services", isAuthenticated, isAdmin, getAllServices);
router.get("/services/category/:category", isAuthenticated, isAdmin, getServicesByCategory);
router.get("/services/slug/:slug", isAuthenticated, isAdmin, getServiceBySlug);
router.put("/services/:slug", isAuthenticated, isAdmin, updateService);
router.delete("/services/:slug", isAuthenticated, isAdmin, deleteService);

router.get("/service-plans", isAuthenticated, isAdmin, getServicePlans);
router.post("/service-plans", isAuthenticated, isAdmin, createServicePlan);
router.get("/service-plans/service/:serviceId", isAuthenticated, isAdmin, getServicePlanByServiceId);
router.put("/service-plans/service/:serviceId", isAuthenticated, isAdmin, updateServicePlan);
router.delete("/service-plans/service/:serviceId", isAuthenticated, isAdmin, deleteServicePlan);

router.post("/articles", isAuthenticated, isAdmin, createArticle);
router.get("/articles", getAllArticles);
router.get("/articles/slug/:slug", getArticleBySlug);
router.get("/articles/:id/related", getRelatedArticles);
router.get("/articles/:id", getArticleById);
router.put("/articles/:id", isAuthenticated, isAdmin, updateArticle);
router.delete("/articles/:id", isAuthenticated, isAdmin, deleteArticle);

router.get("/website-settings", isAuthenticated, isAdmin, getWebsiteSettings);
router.put("/website-settings", isAuthenticated, isAdmin, updateWebsiteSettings);

export default router;