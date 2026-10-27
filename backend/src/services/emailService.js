const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');

// Ensure environment variables are loaded regardless of current working directory
if (!process.env.SMTP_USER) {
  const backendEnv = path.join(__dirname, '../../.env');
  const rootEnv = path.join(__dirname, '../../../.env');
  if (fs.existsSync(backendEnv)) {
    dotenv.config({ path: backendEnv });
  } else if (fs.existsSync(rootEnv)) {
    dotenv.config({ path: rootEnv });
  } else {
    dotenv.config();
  }
}

/**
 * Configure email transporter
 * Supports native Gmail service as well as custom SMTP hosts.
 */
const getTransporter = () => {
  const service = process.env.SMTP_SERVICE;
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const rawPass = process.env.SMTP_PASS;

  // If credentials are empty or placeholders, return null (runs in simulation mode)
  if (!user || !rawPass) {
    return null;
  }

  const isPlaceholder = 
    user.includes('your-email@') || 
    rawPass.includes('your-email-app-password') || 
    rawPass.includes('your-16-char');

  if (isPlaceholder) {
    return null;
  }

  // Google App Passwords are 16 letters usually shown in 4-letter groups separated by spaces
  // (e.g. "abcd efgh ijkl mnop"). Strip all spaces and accidental wrapping quotes.
  const pass = rawPass.replace(/\s+/g, '').replace(/^["']|["']$/g, '');

  const isGmail = (service && service.toLowerCase() === 'gmail') ||
                  (host && host.toLowerCase().includes('gmail')) ||
                  (user && user.toLowerCase().endsWith('@gmail.com'));

  if (isGmail) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: user.trim(),
        pass: pass
      },
      tls: {
        rejectUnauthorized: false // Prevents Windows/firewall SSL handshake failures
      }
    });
  }

  // Custom SMTP configuration (e.g. Brevo, Mailgun, Outlook, SendGrid, private SMTP)
  const port = Number(process.env.SMTP_PORT) || 587;
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  return nodemailer.createTransport({
    host: host || 'smtp.gmail.com',
    port: port,
    secure: secure,
    auth: {
      user: user.trim(),
      pass: pass
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

/**
 * Get from address matching sender
 */
const getFromAddress = () => {
  if (process.env.SMTP_FROM) {
    return process.env.SMTP_FROM;
  }
  const fromName = (process.env.SMTP_FROM_NAME || 'InterviewPrep Portal').replace(/^["']|["']$/g, '').trim();
  const user = process.env.SMTP_USER;
  if (user && !user.includes('your-email@')) {
    return `"${fromName}" <${user.trim()}>`;
  }
  return `"${fromName}" <no-reply@interviewprep.org>`;
};

/**
 * Verify transporter connection status
 */
const verifyEmailTransporter = async () => {
  const transporter = getTransporter();
  if (!transporter) {
    return {
      configured: false,
      message: 'SMTP credentials not configured in backend/.env (running in simulation fallback).'
    };
  }

  try {
    await transporter.verify();
    return {
      configured: true,
      verified: true,
      message: 'Nodemailer SMTP connection verified and ready to send emails!'
    };
  } catch (err) {
    let hint = '';
    if (err.code === 'EAUTH' || (err.response && err.response.includes('535'))) {
      hint = 'Authentication failed. Make sure you use a 16-character Google App Password (not your normal Gmail password), and ensure 2-Step Verification is enabled in your Google account.';
    } else if (err.code === 'ESOCKET' || err.code === 'ETIMEDOUT') {
      hint = 'Network connection timed out. Check your internet connection or firewall rules.';
    }

    return {
      configured: true,
      verified: false,
      error: err.message,
      code: err.code,
      hint: hint
    };
  }
};

/**
 * Send OTP Verification Email
 */
const sendOtpEmail = async (email, otp) => {
  const transporter = getTransporter();
  const fromAddress = getFromAddress();

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Login Code</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; color: #e2e8f0; margin: 0; padding: 24px 12px; }
        .wrapper { width: 100%; max-width: 520px; margin: 0 auto; background: #121826; border-radius: 16px; border: 1px solid rgba(99, 102, 241, 0.3); padding: 36px 28px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
        .header { text-align: center; margin-bottom: 24px; }
        .brand { font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; }
        .brand span { color: #818cf8; }
        .badge { display: inline-block; padding: 5px 12px; background: rgba(99, 102, 241, 0.2); color: #818cf8; border-radius: 20px; font-size: 12px; font-weight: 600; margin-top: 8px; border: 1px solid rgba(99, 102, 241, 0.4); }
        .title { font-size: 20px; color: #ffffff; margin-top: 24px; font-weight: 700; text-align: center; }
        .text { font-size: 14px; color: #94a3b8; line-height: 1.6; text-align: center; margin-top: 10px; }
        .otp-container { background: rgba(99, 102, 241, 0.1); border: 2px dashed #6366f1; border-radius: 14px; padding: 20px; margin: 26px 0; text-align: center; }
        .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 800; color: #38bdf8; letter-spacing: 10px; margin-left: 10px; }
        .timer { font-size: 13px; color: #fbbf24; text-align: center; margin-top: 14px; font-weight: 500; }
        .security-notice { font-size: 12px; color: #64748b; background: rgba(255, 255, 255, 0.03); border-radius: 8px; padding: 12px; margin-top: 20px; text-align: center; }
        .footer { font-size: 11px; color: #475569; text-align: center; margin-top: 28px; line-height: 1.5; border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 18px; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <div class="brand">Interview<span>Prep</span></div>
          <div class="badge">Interview Mentorship Portal</div>
          <div class="title">Your One-Time Login Code</div>
          <p class="text">
            Enter this 6-digit verification code to securely access your student or mentor dashboard.
          </p>
        </div>

        <div class="otp-container">
          <div class="otp-code">${otp}</div>
        </div>

        <div class="timer">
          ⏱️ This code will expire in <strong>10 minutes</strong>.
        </div>

        <div class="security-notice">
          🔒 <strong>Security Tip:</strong> Never share this code with anyone. Our team will never ask for your verification code.
        </div>

        <div class="footer">
          If you didn't attempt to sign in to InterviewPrep, you can safely ignore this email.<br>
          © 2026 InterviewPrep • Mentorship with Dr. Parkavi A. • Ramaiah Institute of Technology
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
        text: `Your InterviewPrep verification code is: ${otp}. It is valid for 10 minutes. Never share this code with anyone.`,
        html: htmlContent
      });

      console.log(`[Email Service] ✅ Real email dispatched via Nodemailer to ${email} (MessageID: ${info.messageId})`);
      return { 
        success: true, 
        messageId: info.messageId, 
        simulated: false,
        deliveryMethod: 'nodemailer_smtp'
      };
    } catch (err) {
      console.error(`[Email Service] ❌ Failed sending via Nodemailer SMTP to ${email}:`, err.message);
      
      let hint = '';
      if (err.code === 'EAUTH' || (err.response && err.response.includes('535'))) {
        hint = 'Authentication failed. Please verify your Gmail address and 16-character App Password (ensure 2-Step Verification is active on Google).';
      } else if (err.code === 'ESOCKET' || err.code === 'ETIMEDOUT') {
        hint = 'Connection timed out. Check your internet connection or network firewall.';
      }

      return {
        success: false,
        error: `${err.message}${hint ? ` - ${hint}` : ''}`,
        code: err.code,
        simulated: false
      };
    }
  }

  // Fallback for development / simulated mode when credentials are missing or default
  console.log('=======================================================');
  console.log(`📧 [EMAIL OTP SIMULATION - SMTP NOT CONFIGURED]`);
  console.log(`Recipient: ${email}`);
  console.log(`🔑 Verification OTP: ${otp}`);
  console.log(`Valid for: 10 minutes`);
  console.log(`ℹ️ Add your Gmail and 16-char App Password to backend/.env to send real emails.`);
  console.log('=======================================================');

  return { 
    success: true, 
    simulated: true, 
    otp,
    message: 'SMTP credentials not configured. OTP generated in dev simulation mode.'
  };
};

module.exports = {
  sendOtpEmail,
  verifyEmailTransporter,
  getTransporter,
  getFromAddress
};
