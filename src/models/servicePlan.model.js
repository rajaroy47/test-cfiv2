import mongoose from "mongoose";

const ServicePlanSchema = new mongoose.Schema({
    serviceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Service",
        required: true
    },

    plans: [
        {
            basic: {
                name: {
                    type: String,
                    default: "Basic"
                },
                price: {
                    type: Number,
                    min: 1,
                    required: true
                },
                discount: {
                    type: Number,
                    default: 0
                },
                finalPrice: {
                    type: Number,
                    required: true
                },
                features: [String]
            },

            standard: {
                name: {
                    type: String,
                    default: "Standard"
                },
                price: {
                    type: Number,
                    min: 1,
                    required: true
                },  
                discount: {
                    type: Number,
                    default: 0
                },
                finalPrice: {
                    type: Number,
                    required: true
                },
                features: [String]
            },

            premium: {
                name: {
                    type: String,
                    default: "Premium"
                },
                price: {
                    type: Number,
                    min: 1,
                    required: true
                },
                discount: {
                    type: Number,
                    default: 0
                },
                finalPrice: {
                    type: Number,
                    required: true
                },
                features: [String]
            }
        }
    ],

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }

}, { timestamps: true });

const ServicePlan = mongoose.model("ServicePlan", ServicePlanSchema);

export default ServicePlan;

