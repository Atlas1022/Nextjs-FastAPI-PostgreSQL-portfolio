import os
from pathlib import Path
from html import escape

import resend
from dotenv import load_dotenv


# Load environment variables from the project root
PROJECT_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(PROJECT_ROOT / ".env.local")


# Configure Resend
RESEND_API_KEY = os.getenv("RESEND_API_KEY")

if not RESEND_API_KEY:
    raise RuntimeError("RESEND_API_KEY is not configured.")

resend.api_key = RESEND_API_KEY


# Test sender provided by Resend
SENDER_EMAIL = "onboarding@resend.dev"


def send_contact_email(
    name: str,
    email: str,
    subject: str,
    message: str,
    recipient: str,
):
    # Escape user-provided content for safe HTML rendering
    safe_name = escape(name)
    safe_email = escape(email)
    safe_subject = escape(subject)
    safe_message = escape(message).replace("\n", "<br>")

    html_content = f"""
    <div style="background-color:#f1f5f9;padding:32px 16px;font-family:Arial,sans-serif;">
        <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">

            <div style="background:#0b1120;padding:24px;color:#ffffff;">
                <h1 style="margin:0;font-size:22px;">
                    New Portfolio Contact Message
                </h1>
                <p style="margin:8px 0 0;color:#94a3b8;font-size:14px;">
                    Someone has contacted you through your portfolio.
                </p>
            </div>

            <div style="padding:24px;">
                <div style="margin-bottom:20px;">
                    <p style="margin:0 0 6px;color:#64748b;font-size:12px;">
                        SENDER NAME
                    </p>
                    <p style="margin:0;color:#0f172a;font-size:16px;font-weight:bold;">
                        {safe_name}
                    </p>
                </div>

                <div style="margin-bottom:20px;">
                    <p style="margin:0 0 6px;color:#64748b;font-size:12px;">
                        EMAIL ADDRESS
                    </p>
                    <p style="margin:0;font-size:15px;">
                        <a href="mailto:{safe_email}" style="color:#0284c7;text-decoration:none;">
                            {safe_email}
                        </a>
                    </p>
                </div>

                <div style="margin-bottom:20px;">
                    <p style="margin:0 0 6px;color:#64748b;font-size:12px;">
                        SUBJECT
                    </p>
                    <p style="margin:0;color:#0f172a;font-size:15px;">
                        {safe_subject}
                    </p>
                </div>

                <div>
                    <p style="margin:0 0 10px;color:#64748b;font-size:12px;">
                        MESSAGE
                    </p>
                    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;color:#334155;font-size:14px;line-height:1.7;">
                        {safe_message}
                    </div>
                </div>
            </div>

            <div style="padding:16px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;">
                <p style="margin:0;color:#64748b;font-size:12px;">
                    Sent from your portfolio contact form.
                </p>
            </div>

        </div>
    </div>
    """

    text_content = (
        "New Portfolio Contact Message\n"
        "=============================\n\n"
        f"Name: {name}\n"
        f"Email: {email}\n"
        f"Subject: {subject}\n\n"
        "Message:\n"
        f"{message}\n\n"
        "Sent from your portfolio contact form."
    )

    params = {
        "from": SENDER_EMAIL,
        "to": [recipient],
        "reply_to": email,
        "subject": f"Portfolio Contact: {subject}",
        "html": html_content,
        "text": text_content,
    }

    return resend.Emails.send(params)