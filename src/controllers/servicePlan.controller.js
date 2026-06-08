import ServicePlan from "../models/servicePlan.model.js";

export const getServicePlans = async (req, res) => {
    try {
        const servicePlans = await ServicePlan.find().populate("serviceId", "name slug");

        if (servicePlans.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No service plans found"
            });
        }

        return res.status(200).json({
            success: true,
            data: servicePlans
        });
    } catch (error) {
        console.error("Error fetching service plans:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

export const createServicePlan = async (req, res) => {
    try {
        const { serviceId, plans } = req.body;

        if (!serviceId) {
            return res.status(400).json({
                success: false,
                message: "Service ID is required"
            });
        }

        const existingPlan = await ServicePlan.findOne({ serviceId });
        if (existingPlan) {
            return res.status(400).json({
                success: false,
                message: "Service plan already exists for the given service ID"
            });
        }
        
        const servicePlan = await ServicePlan.create({
            serviceId,
            plans,
            createdBy: req.user._id
        });

        return res.status(201).json({
            success: true,
            message: "Service plan created successfully",
            data: servicePlan
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const getServicePlanByServiceId = async (req, res) => {
    try {
        const serviceId = req.params.serviceId;
        
        if (!serviceId) {
            return res.status(400).json({
                success: false,
                message: "Service ID is required"
            });
        }

        const servicePlan = await ServicePlan.findOne({ serviceId }).populate("serviceId", "name slug");

        if (!servicePlan) { 
            return res.status(404).json({
                success: false,
                message: "Service plan not found for the given service ID"
            });
        }

        return res.status(200).json({
            success: true,
            data: servicePlan
        });
    } catch (error) {
        console.error("Error fetching service plan by service ID:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

export const updateServicePlan = async (req, res) => {
    try {
        const serviceId = req.params.serviceId;
        
        if (!serviceId) {
            return res.status(400).json({
                success: false,
                message: "Service ID is required"
            });
        }

        const servicePlan = await ServicePlan.findOne({ serviceId });
        
        if (!servicePlan) {
            return res.status(404).json({
                success: false,
                message: "Service plan not found for the given service ID"
            });
        }

        // Check if the request body wraps the tiers in a "plans" object, or sends them directly
        const updates = req.body.plans || req.body;

        // Deep merge the objects so we don't overwrite existing data (like features) 
        // if we are only updating specific fields like `isRecommended` or `isAllIncluded`
        if (updates.basic) {
            servicePlan.plans.basic = {
                ...(servicePlan.plans.basic ? servicePlan.plans.basic.toObject() : {}),
                ...updates.basic
            };
        }

        if (updates.standard) {
            servicePlan.plans.standard = {
                ...(servicePlan.plans.standard ? servicePlan.plans.standard.toObject() : {}),
                ...updates.standard
            };
        }

        if (updates.premium) {
            servicePlan.plans.premium = {
                ...(servicePlan.plans.premium ? servicePlan.plans.premium.toObject() : {}),
                ...updates.premium
            };
        }

        // Force mongoose to recognize that the mixed/nested 'plans' object has been modified
        servicePlan.markModified('plans');
        
        await servicePlan.save();

        return res.status(200).json({
            success: true,
            message: "Service plan updated successfully",
            data: servicePlan
        });
    } catch (error) {
        console.error("Error updating service plan:", error);
        return res.status(500).json({  
            success: false,
            message: "Internal server error"
        });
    }
};

export const deleteServicePlan = async (req, res) => {
    try {
        const serviceId = req.params.serviceId; 
        
        if (!serviceId) {
            return res.status(400).json({
                success: false,
                message: "Service ID is required"
            });
        }

        // findOneAndDelete is more efficient than finding and then deleting separately
        const deletedPlan = await ServicePlan.findOneAndDelete({ serviceId });
        
        if (!deletedPlan) {
            return res.status(404).json({
                success: false,
                message: "Service plan not found for the given service ID"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Service plan deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting service plan:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};