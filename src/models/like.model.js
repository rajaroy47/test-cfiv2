import mongoose from "mongoose";

const likeSchema = new mongoose.Schema(
    {
        articleId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Article",
            required: true,
        },

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

likeSchema.index(
    {
        articleId: 1,
        userId: 1,
    },
    {
        unique: true,
    }
);

export default mongoose.model("Like", likeSchema);