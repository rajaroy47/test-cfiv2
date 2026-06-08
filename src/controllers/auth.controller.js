import User from "../models/user.model.js";

import {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
} from "../utils/jwtToken.js";

import { sendMail } from "../utils/sendMail.js";
import { welcomeEmailTemplate } from "../templates/welcomeEmail.Template.js";

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
};

export const registerUser = async (req, res) => {
    try {
        const { fullName, email, password } = req.body;

        if (!fullName || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "User already exists",
            });
        }

        const user = await User.create({
            fullName,
            email,
            password,
        });

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        user.refreshToken = refreshToken;

        await user.save({
            validateBeforeSave: false,
        });

        const createdUser = await User.findById(user._id).select(
            "-password -refreshToken"
        );
        
        await sendMail({
            to: createdUser.email,
            subject: "Welcome to CFI V2.0",
            html: welcomeEmailTemplate(createdUser.fullName),
        });

        return res
            .status(201)
            .cookie("accessToken", accessToken, {
                ...cookieOptions,
                maxAge: 55 * 60 * 1000,
            })
            .cookie("refreshToken", refreshToken, {
                ...cookieOptions,
                maxAge: 7 * 24 * 60 * 60 * 1000,
            })
            .json({
                success: true,
                message: "User registered successfully",
                user: createdUser,
                accessToken,
                refreshToken,
            });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        if (user.isBlocked) {
            return res.status(403).json({
                success: false,
                message: "Your account has been blocked",
            });
        }

        const isPasswordCorrect =
            await user.matchPassword(password);

        if (!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        user.refreshToken = refreshToken;

        await user.save({
            validateBeforeSave: false,
        });

        const loggedInUser = await User.findById(user._id).select(
            "-password -refreshToken"
        );

        return res
            .status(200)
            .cookie("accessToken", accessToken, {
                ...cookieOptions,
                maxAge: 55 * 60 * 1000,
            })
            .cookie("refreshToken", refreshToken, {
                ...cookieOptions,
                maxAge: 7 * 24 * 60 * 60 * 1000,
            })
            .json({
                success: true,
                message: "Login successful",
                user: loggedInUser,
                accessToken,
                refreshToken,
            });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const refreshAccessToken = async (req, res) => {
    try {
        const incomingRefreshToken =
            req.cookies?.refreshToken;

        if (!incomingRefreshToken) {
            return res.status(401).json({
                success: false,
                message: "Refresh token missing",
            });
        }

        const decoded = verifyRefreshToken(
            incomingRefreshToken
        );

        const user = await User.findById(decoded.id);

        if (
            !user ||
            user.refreshToken !== incomingRefreshToken
        ) {
            return res.status(401).json({
                success: false,
                message: "Invalid refresh token",
            });
        }

        const accessToken = generateAccessToken(user);

        return res
            .status(200)
            .cookie("accessToken", accessToken, {
                ...cookieOptions,
                maxAge: 15 * 60 * 1000,
            })
            .json({
                success: true,
                accessToken,
            });
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Refresh token expired",
        });
    }
};

export const logoutUser = async (req, res) => {
    try {
        if (req.user) {
            await User.findByIdAndUpdate(req.user._id, {
                $unset: {
                    refreshToken: 1,
                },
            });
        }

        return res
            .clearCookie("accessToken")
            .clearCookie("refreshToken")
            .status(200)
            .json({
                success: true,
                message: "Logout successful",
            });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};