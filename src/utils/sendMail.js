import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // false for port 587 (STARTTLS)
    auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD, // Gmail App Password
    },
    tls: {
        // Only disable certificate validation in development
        rejectUnauthorized: process.env.NODE_ENV === "production",
    },
});

// Verify SMTP connection when server starts
transporter.verify()
    .then(() => {
        console.log("✅ SMTP Server Ready");
    })
    .catch((error) => {
        console.error("❌ SMTP Verification Error:", error.message);
    });

export const sendMail = async ({ to, subject, html }) => {
    try {
        const info = await transporter.sendMail({
            from: `"CFI V2.0" <${process.env.SMTP_EMAIL}>`,
            to,
            subject,
            html,
        });

        console.log("✅ Email sent:", info.messageId);

        return info;
    } catch (error) {
        console.error("❌ Email sending failed:", error.message);
        throw error;
    }
};