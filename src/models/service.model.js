import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },

    slug: {
        type: String,
        required: true,
        unique: true
    },

    serviceCategory: {
        type: String,
        required: true
    },

    serviceImage: {
        type: String,
    },

    sideImage: {
        type: String,
        required: true
    },

    shortDescription: {
        type: String,  
        required: true
    },

    longDescription: {
        type: String,
        required: true
    },

    // new fields will be implemnted letter (05.06.26)

    requiredDocs: {
        type: [String],
        required: true
    },

    estimateDays: {
        type: Number,
        required: true,
        default: 7
    },

    faq: [
        {
            question: String,
            answer: String
        }
    ],

    isPopular: {
        type: Boolean,
        default: false
    },
 
    isActive: {
        type: Boolean,
        default: true
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, { timestamps: true });

const Service = mongoose.model("Service", serviceSchema);

export default Service;