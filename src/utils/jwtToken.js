import jwt from "jsonwebtoken";

/**
 * Generate Access Token
 */
export const generateAccessToken = (user) => {
    return jwt.sign(
        {
            id: user._id,
            email: user.email,
            role: user.role,
            fullName: user.fullName,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRE,
        }
    );
};

/**
 * Generate Refresh Token
 */
export const generateRefreshToken = (user) => {
    return jwt.sign(
        {
            id: user._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRE,
        }
    );
};

/**
 * Verify Access Token
 */
export const verifyAccessToken = (token) => {
    return jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET
    );
};

/**
 * Verify Refresh Token
 */
export const verifyRefreshToken = (token) => {
    return jwt.verify(
        token,
        process.env.REFRESH_TOKEN_SECRET
    );
};