import { uploadToCloudinary } from "../utils/cloudinaryUpload.js";

export const uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No file uploaded",
            });
        }

        const result = await uploadToCloudinary(
            req.file.buffer,
            "articles"
        );

        if (!result) {
            return res.status(500).json({
                success: false,
                message: "Image upload failed",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Image uploaded successfully",
            imageUrl: result.secure_url,
            public_id: result.public_id,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};