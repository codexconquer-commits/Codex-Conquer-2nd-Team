import smtplib
from email.message import EmailMessage
import os

SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
EMAIL_ADDRESS = "codexconquer@gmail.com"        # change later
EMAIL_PASSWORD = "sdzv dwaw apze bxjg "         # change later

def send_email(to_email, subject, body, attachment_path=None):
    msg = EmailMessage()
    msg["From"] = EMAIL_ADDRESS
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.set_content(body)

    # 📎 Attach PDF if provided
    if attachment_path and os.path.exists(attachment_path):
        with open(attachment_path, "rb") as f:
            file_data = f.read()
            file_name = os.path.basename(attachment_path)

        msg.add_attachment(
            file_data,
            maintype="application",
            subtype="pdf",
            filename=file_name
        )

    server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
    server.starttls()
    server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
    #server.login('''SENDER_EMAIL, SENDER_PASSWORD'''EMAIL_ADDRESS , EMAIL_PASSWORD)
    server.send_message(msg)
    server.quit()