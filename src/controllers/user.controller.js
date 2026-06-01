import User from "../models/user.model.js";

export const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("-password");
        res.status(200).json({ message: "User profile retrieved successfully", user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        // Update user profile
        const { fullName, email } = req.body;

        if (!fullName && !email) {
            return res.status(400).json({ message: "Please provide at least one field to update" });
        }   

        user.fullName = fullName || user.fullName;
        user.email = email || user.email;

        await user.save();
        res.status(200).json({ message: "User profile updated successfully", user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};