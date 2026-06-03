import { generateToken, verifyToken } from "../utils/jwtToken.js";
import User from "../models/user.model.js";


export const registerUser = async (req, res) => {
    try {
        const { fullName, email, password } = req.body;

        if (!fullName || !email || !password) {
            return res.status(400).json({ message: "Please provide all required fields" });
        }
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }
        // Create new user
        const user = await User.create({
            fullName,
            email,
            password
        });
        
        // Generate token
        const token = generateToken({ id: user._id });
        
        // Convert to plain object and remove password before sending (if you decide to send user data here later)
        const userWithoutPassword = user.toObject();
        delete userWithoutPassword.password;

        res.status(201).json({ 
            message: "User registered successfully", 
            user: userWithoutPassword, 
            token 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Please provide email and password" });
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        if (user.isBlocked) {
            return res.status(403).json({ message: "Your account has been blocked. Please contact support." });
        }

        // Check if password is correct
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or password" });
        }
        // Generate token
        const token = generateToken({ id: user._id });

        res.cookie("token", token, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        });

        // 🌟 SAFETY FIX: Convert document to plain object and strip the password
        const userWithoutPassword = user.toObject();
        delete userWithoutPassword.password;

        res.status(200).json({ 
            message: "Login successful", 
            user: userWithoutPassword, 
            token 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const logoutUser = async (req, res) => {
    try {
        res.cookie("token", "", {
            httpOnly: true,
            expires: new Date(0),
        });

        return res.status(200).json({
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