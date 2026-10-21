const nodemailer = require('nodemailer');

/**
 * Configure email transporter
 */
const getTransporter = () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }
  return null;
};

/**
 * Send OTP Verification Email
 */
const sendOtpEmail = async (email, otp) => {
  const fromAddress = process.env.SMTP_FROM || 'InterviewPrep <no-reply@interviewprep.org>';
  const transporter = getTransporter();

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; color: #e2e8f0; margin: 0; padding: 24px; }
        .container { max-width: 520px; margin: 0 auto; background: #121826; border-radius: 16px; border: 1px solid rgba(99, 102, 241, 0.25); padding: 36px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
        .header { text-align: center; margin-bottom: 24px; }
        .brand { font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px; }
        .badge { display: inline-block; padding: 4px 10px; background: rgba(99, 102, 241, 0.2); color: #818cf8; border-radius: 20px; font-size: 12px; font-weight: 600; margin-top: 6px; }
        .title { font-size: 20px; color: #ffffff; margin-top: 20px; font-weight: 600; text-align: center; }
        .text { font-size: 14px; color: #94a3b8; line-height: 1.6; text-align: center; margin-top: 10px; }
        .otp-box { background: rgba(99, 102, 241, 0.1); border: 2px dashed #6366f1; border-radius: 12px; padding: 18px; margin: 26px 0; text-align: center; }
        .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; color: #38bdf8; letter-spacing: 8px; }
        .footer { font-size: 12px; color: #64748b; text-align: center; margin-top: 28px; line-height: 1.5; border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 18px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="brand">InterviewPrep</div>
          <div class="badge">Interview Mentorship Portal</div>
          <div class="title">Your One-Time Login Code</div>
          <p class="text">
            Use the 6-digit verification code below to sign in securely to your account.
          </p>
        </div>

        <div class="otp-box">
          <div class="otp-code">${otp}</div>
        </div>

        <p class="text" style="font-size: 13px;">
          ⏱️ This verification code is valid for <strong>10 minutes</strong>. Never share this code with anyone.
        </p>

        <div class="footer">
          If you didn't request this code, you can safely disregard this email.<br>
          © 2026 InterviewPrep • Mentorship with Dr. Parkavi A.
        </div>
      </div>
    </body>
    </html>
  `;

  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: fromAddress,
        to: email,
        subject: `Your InterviewPrep Login Code: ${otp}`,
        text: `Your InterviewPrep verification code is: ${otp}. It is valid for 10 minutes.`,
        html: htmlContent
      });
      console.log(`[Email Service] ✅ Real email dispatched to ${email}: ${info.messageId}`);
      return { success: true, messageId: info.messageId, simulated: false };
    } catch (err) {
      console.warn(`[Email Service] ⚠️ Failed sending via SMTP: ${err.message}. Falling back to console log.`);
    }
  }

  // Fallback for development / simulated mode
  console.log('=======================================================');
  console.log(`📧 [EMAIL OTP SIMULATION]`);
  console.log(`Recipient: ${email}`);
  console.log(`🔑 Verification OTP: ${otp}`);
  console.log(`Valid for: 10 minutes`);
  console.log('=======================================================');

  return { success: true, simulated: true, otp };
};

module.exports = {
  sendOtpEmail
};
