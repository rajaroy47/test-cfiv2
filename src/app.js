import dotenv from "dotenv";
import express from "express";
dotenv.config();

import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import publicRoutes from "./routes/public.routes.js";

const app = express();

app.use(cors({
    origin: [
        "http://localhost:5173",
        "http://localhost:5174"
    ],
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const PORT = process.env.PORT;

app.get("/health", (req, res)=>{
    return res.status(200).json({
        success: true,
        message: "I am healthy"
    })
})

// public route for all users without authentication for visiting the website
app.use("/api/public", publicRoutes);

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);

app.use("/api/admin", adminRoutes);


// app.use(errorMiddleware);

export default app;