import ServiceStatus from "../models/serviceStatus.model.js";

export const getServiceStatus = async(req, res) => {
    try {

        const serviceId = req.params.serviceId;
        const userId = req.user._id;

        const serviceStatus = await ServiceStatus.findOne({ serviceId, subscribedBy: userId });

        if (!serviceStatus) {
            return res.status(404).json({
                success: false,
                message: "Service status not found"
            });
        }
        return res.status(200).json({
            success: true,
            data: serviceStatus
        });
        
    } catch (error) {
        console.error("Error fetching service status:", error);
        throw error;
    }
}