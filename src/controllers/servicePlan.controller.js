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
        const {
            serviceId,
            basic,
            standard,
            premium
        } = req.body;

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
            plans: [
                {
                    basic,
                    standard,
                    premium
                }
            ],
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
        const { basic, standard, premium } = req.body;

        servicePlan.plans = [
            {
                basic: basic || servicePlan.plans[0].basic,
                standard: standard || servicePlan.plans[0].standard,
                premium: premium || servicePlan.plans[0].premium
            }
        ]; 
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
        const servicePlan = await ServicePlan.findOne({ serviceId });
        if (!servicePlan) {
            return res.status(404).json({
                success: false,
                message: "Service plan not found for the given service ID"
            });
        }
        await ServicePlan.findByIdAndDelete(servicePlan._id);

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
