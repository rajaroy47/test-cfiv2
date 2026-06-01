import User from "../models/user.model.js";

export const getAdminDashboard = (req, res) => {
    res.status(200).json({ message: "Welcome to the admin dashboard" });
};

export const blockUser = async (req, res) => {
    const userId = req.params.id;

    console.log("Blocking user with ID:", userId);

    if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
    }
    const user = await User.findById(userId);

    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }
    console.log("Found user:", user);
    user.isBlocked = true;

    await user.save();
    res.status(200).json({ message: "User blocked successfully" });
};

export const unblockUser = async (req, res) => {
    const userId = req.params.id;
    if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
    }
    const user = await User.findById(userId);

    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }
    user.isBlocked = false;
    await user.save();

    res.status(200).json({ message: "User unblocked successfully" });
};

export const deleteUser = async (req, res) => {
    const userId = req.params.id;
    if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
    }
    const user = await User.findById(userId);

    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "admin") {
        return res.status(403).json({ message: "Cannot delete an admin user" });
    }

    await user.remove();
    res.status(200).json({ message: "User deleted successfully" });
};

export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select("-password");
        res.status(200).json({ users });
    } catch (error) {
        res.status(500).json({ message: "Error fetching users", error });
    }
};

export const getUserById = async (req, res) => {
    const userId = req.params.id;
    if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
    }
    try {
        const user = await User.findById(userId).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({ user });
    } catch (error) {
        res.status(500).json({ message: "Error fetching user", error });
    }
};

