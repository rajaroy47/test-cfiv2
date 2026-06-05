import mongoose from "mongoose";

const serviceStatusSchema = new mongoose.Schema({
    serviceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Service",
        required: true
    },
    subscribedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    status: {
        type: String,
        enum: ["processing", "completed", "refunded"],
        default: "processing"
    }

}, { timestamps: true });

const ServiceStatus = mongoose.model("ServiceStatus", serviceStatusSchema);

export default ServiceStatus;