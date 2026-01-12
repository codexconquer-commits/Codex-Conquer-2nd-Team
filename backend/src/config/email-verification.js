import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

// ✅ Transporter setup
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // 465 = true, 587 = false
  auth: {
    user: process.env.NODEMAILER_EMAIL,
    pass: process.env.NODEMAILER_PASSWORD, // Gmail App Password
  },
});

// ✅ Function to send email
const SendEmail = async (to, subject, otp) => {
  try {
    const htmlTemplate = `
      <h2>Your OTP</h2>
      <h1>${otp}</h1>
      <p>This OTP is valid for 5 minutes.</p>
    `;

    const info = await transporter.sendMail({
      from: `"CONVO OTP" <${process.env.NODEMAILER_EMAIL}>`,
      to,
      subject,
      html: htmlTemplate,
    });

    return info;
  } catch (error) {
    console.error("❌ Error sending email:", error.message);
    throw new Error("Email sending failed");
  }
};

export { SendEmail };
