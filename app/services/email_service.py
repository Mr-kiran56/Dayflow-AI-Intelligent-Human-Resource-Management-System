import smtplib
import asyncio
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings


class EmailService:
    
    @staticmethod
    def _send_sync(to_email: str, subject: str, html_content: str) -> bool:
        if not settings.SMTP_HOST or not settings.SMTP_USER or not settings.SMTP_PASSWORD:
            print(f"[DEV EMAIL LOG] Verification email generated for {to_email} (SMTP server credentials not configured in .env)")
            return False

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.EMAILS_FROM_EMAIL
        msg["To"] = to_email

        part = MIMEText(html_content, "html")
        msg.attach(part)

        try:
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(settings.EMAILS_FROM_EMAIL, [to_email], msg.as_string())
            print(f"[EMAIL SERVICE] Successfully dispatched live verification email to {to_email}")
            return True
        except Exception as e:
            print(f"[EMAIL SERVICE ERROR] Failed to send email to {to_email}: {e}")
            return False

    @classmethod
    async def send_verification_email(cls, to_email: str, full_name: str, verify_url: str):
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Verify your Dayflow AI Account</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #090d16; margin: 0; padding: 40px 20px;">
          <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 24px; padding: 40px; box-shadow: 0 20px 50px rgba(0,0,0,0.3);">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #1a73e8; font-size: 24px; font-weight: 800; margin: 0;">DayFlow AI</h1>
              <p style="color: #64748b; font-size: 12px; font-weight: 600; margin-top: 4px;">Intelligent Human Resource Management System</p>
            </div>
            
            <h2 style="color: #0f172a; font-size: 18px; font-weight: 700; margin-top: 0;">Account Verification</h2>
            <p style="color: #334155; font-size: 14px; line-height: 1.6;">Hello <strong>{full_name}</strong>,</p>
            <p style="color: #334155; font-size: 14px; line-height: 1.6;">Thank you for registering with Dayflow AI HRMS. Please click the button below to verify your email address and activate your account:</p>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="{verify_url}" style="background-color: #1a73e8; color: #ffffff; padding: 14px 28px; border-radius: 50px; text-decoration: none; font-weight: 700; font-size: 14px; display: inline-block; box-shadow: 0 4px 12px rgba(26,115,232,0.3);">Verify Email & Activate Account</a>
            </div>

            <p style="color: #64748b; font-size: 12px; line-height: 1.5;">Or copy and paste this link into your browser:<br>
            <a href="{verify_url}" style="color: #1a73e8; word-break: break-all;">{verify_url}</a></p>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0 20px 0;">
            <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">If you did not create this account, please ignore this email.</p>
          </div>
        </body>
        </html>
        """
        await asyncio.to_thread(cls._send_sync, to_email, "Verify your Dayflow AI Account", html_content)
