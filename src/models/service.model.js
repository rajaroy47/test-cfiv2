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

    // new fields added

    // requiredDocs: {
    //     type: [String],
    //     required: true
    // },

    faq: [
        {
            question: String,
            answer: String
        }
    ],

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, { timestamps: true });

const Service = mongoose.model("Service", serviceSchema);

export default Service;