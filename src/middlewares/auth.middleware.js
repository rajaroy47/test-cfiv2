import User from "../models/user.model.js";

import {
    verifyAccessToken,
} from "../utils/jwtToken.js";

export const isAuthenticated = async (
    req,
    res,
    next
) => {
    try {
        const token =
            req.cookies?.accessToken ||
            req.header("Authorization")?.replace(
                "Bearer ",
                ""
            );

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized access",
            });
        }

        const decoded =
            verifyAccessToken(token); 

        const user = await User.findById(
            decoded.id
        ).select("-password -refreshToken");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found",
            });
        }

        if (user.isBlocked) {
            return res.status(403).json({
                success: false,
                message:
                    "Your account has been blocked",
            });
        }

        req.user = user;

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token",
        });
    }
};

export const isAdmin = (
    req,
    res,
    next
) => {
    if (req.user?.role === "admin") {
        return next();
    }

    return res.status(403).json({
        success: false,
        message: "Admin access required",
    });
};