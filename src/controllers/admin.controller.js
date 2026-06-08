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

    await user.deleteOne({ _id: userId });
    res.status(200).json({ message: "User deleted successfully" });
};

export const getAllUsers = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const search = req.query.search || "";

        const skip = (page - 1) * limit;

        const searchQuery = {
            $or: [
                {
                    fullName: {
                        $regex: search,
                        $options: "i",
                    },
                },
                {
                    email: {
                        $regex: search,
                        $options: "i",
                    },
                },
            ],
        };

        const totalUsers = await User.countDocuments(
            search ? searchQuery : {}
        );

        const users = await User.find(
            search ? searchQuery : {}
        )
            .select("-password -refreshToken")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        return res.status(200).json({
            success: true,
            users,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(
                    totalUsers / limit
                ),
                totalUsers,
                limit,
                hasNextPage:
                    page <
                    Math.ceil(totalUsers / limit),
                hasPrevPage: page > 1,
            },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error fetching users",
            error: error.message,
        });
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

