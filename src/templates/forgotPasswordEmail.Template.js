// Forgot Password Email Template
export const forgotPasswordEmailTemplate = (name, resetLink) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body{
            font-family: Arial, sans-serif;
            background:#f8fafc;
            padding:20px;
            color:#334155;
        }

        .container{
            background:white;
            max-width:600px;
            margin:auto;
            padding:30px;
            border-radius:10px;
            border:1px solid #e2e8f0;
        }

        .button{
            display:inline-block;
            padding:12px 20px;
            background:#2563eb;
            color:white !important;
            text-decoration:none;
            border-radius:6px;
            font-weight:bold;
        }

        .footer{
            margin-top:30px;
            font-size:13px;
            color:#64748b;
        }
    </style>
</head>
<body>
    <div class="container">
        <h2>Hello ${name},</h2>

        <p>
            We received a request to reset your password for your CFI V2.0 account.
        </p>

        <p>
            Click the button below to create a new password:
        </p>

        <p>
            <a href="${resetLink}" class="button">
                Reset Password
            </a>
        </p>

        <p>
            If you did not request this password reset, you can safely ignore this email. Your password will remain unchanged.
        </p>

        <div class="footer">
            This password reset link may expire after a certain period for security reasons.
        </div>
    </div>
</body>
</html>
`;