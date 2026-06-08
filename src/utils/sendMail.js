import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
    },
});

transporter.verify((error, success) => {
    if (error) {
        console.error("SMTP Error:", error);
    } else {
        console.log("SMTP Server Ready");
    }
});

export const sendMail = async ({ to, subject, html }) => {
    return transporter.sendMail({
        from: `"CFI V2.0" <${process.env.SMTP_EMAIL}>`,
        to,
        subject,
        html,
    });
};