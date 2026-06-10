import User from "../models/user.model.js";
import { uploadToCloudinary } from "../utils/cloudinaryUpload.js";

export const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select("-password -refreshToken");

        return res.status(200).json({
            success: true,
            user,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * json raw data
 * {
    "address": {
        "streetAddress": "MG Road, Howrah, Kolkata - 700001",
        "city": "Kolkata",
        "state": "West Bengal",
        "postalCode": "700001"
    },

    "identity": {
        "panCard": "AAAAA1234A",
        "aadhaarCard": "986585698569",
        "phone": "8101745698"
    }
}

* form data
*
*
*
 */


export const updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        let { fullName, address, identity } = req.body;

        // Initialize userDetails if it does not exist in the document
        if (!user.userDetails) {
            user.userDetails = {};
        }

        // 1. Safely Parse Address (Handles both JSON and form-data strings)
        if (address) {
            if (typeof address === "string") {
                try {
                    address = JSON.parse(address);
                } catch (e) {
                    return res.status(400).json({ success: false, message: "Invalid address format" });
                }
            }
            
            // Assign sub-properties explicitly to ensure Mongoose tracks changes
            user.userDetails.address = {
                ...(user.userDetails.address || {}),
                ...address,
            };
        }

        // 2. Safely Parse Identity (Handles both JSON and form-data strings)
        if (identity) {
            if (typeof identity === "string") {
                try {
                    identity = JSON.parse(identity);
                } catch (e) {
                    return res.status(400).json({ success: false, message: "Invalid identity format" });
                }
            }

            if (identity.panCard) {
                identity.panCard = identity.panCard.toUpperCase();
            }

            user.userDetails.identity = {
                ...(user.userDetails.identity || {}),
                ...identity,
            };
        }

        // 3. Process File Upload (Avatar)
        if (req.file) {
            const uploadedAvatar = await uploadToCloudinary(
                req.file.buffer,
                "avatars"
            );
            user.avatar = uploadedAvatar.secure_url;
        }

        // 4. Update Simple Strings
        if (fullName && fullName.trim()) {
            user.fullName = fullName.trim();
        }

        // Tell Mongoose explicitly to check nested objects for modifications
        user.markModified('userDetails');

        // Save changes
        await user.save();

        // Fetch freshly updated profile without sensitive data
        const updatedUser = await User.findById(user._id)
            .select("-password -refreshToken");

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user: updatedUser,
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


export const updatePassword = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const { oldPassword, newPassword } = req.body;
        if (!user) {
            res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
        const isPasswordCorrect = await user.matchPassword(oldPassword);
        if (!isPasswordCorrect) {
            res.status(401).json({
                success: false,
                message: "Invalid old password",
            });
        }
        user.password = newPassword;
        await user.save();
        return res.status(200).json({
            success: true,
            message: "Password updated successfully",
        });
    }
    catch (error) {
        return res.staus(500).json({
            success: false,
            message: error.message,
        });
    }
};

