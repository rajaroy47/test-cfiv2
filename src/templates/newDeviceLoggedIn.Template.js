// New Device Login Alert Email Template
export const newDeviceLoggedInTemplate = (
    name,
    device = "Unknown Device",
    location = "Unknown Location",
    loginTime = new Date().toLocaleString()
) => `
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

        .alert{
            background:#fef2f2;
            color:#b91c1c;
            padding:15px;
            border-radius:8px;
            margin:20px 0;
            border-left:4px solid #dc2626;
        }

        .details{
            background:#f8fafc;
            padding:15px;
            border-radius:8px;
            margin-top:20px;
        }

        .footer{
            margin-top:30px;
            font-size:13px;
            color:#64748b;
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
    </style>
</head>
<body>
    <div class="container">
        <h2>Hello ${name},</h2>

        <div class="alert">
            A new login to your CFI V2.0 account was detected.
        </div>

        <p>
            Here are the details of the recent sign in:
        </p>

        <div class="details">
            <p><strong>Device:</strong> ${device}</p>
            <p><strong>Location:</strong> ${location}</p>
            <p><strong>Time:</strong> ${loginTime}</p>
        </div>

        <p>
            If this was you, no further action is required.
        </p>

        <p>
            If you do not recognize this activity, please reset your password immediately and review your account security.
        </p>

        <p>
            <a href="#" class="button">
                Secure My Account
            </a>
        </p>

        <div class="footer">
            This notification was sent to help keep your account secure.
        </div>
    </div>
</body>
</html>
`;