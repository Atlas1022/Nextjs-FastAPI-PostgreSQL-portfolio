
import os
from pathlib import Path

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
    params = {
        "from": SENDER_EMAIL,
        "to": [recipient],
        "reply_to": email,
        "subject": f"Portfolio Contact: {subject}",
        "text": (
            f"New message from your portfolio contact form.\n\n"
            f"Name: {name}\n"
            f"Email: {email}\n"
            f"Subject: {subject}\n\n"
            f"Message:\n{message}"
        ),
    }

    return resend.Emails.send(params)
