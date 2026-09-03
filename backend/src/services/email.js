const nodemailer = require('nodemailer');

const smtpConfigured =
  process.env.SMTP_HOST &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASS;

// Only build the transporter when credentials are present
const transporter = smtpConfigured
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : null;

async function sendOTPEmail(to, otp) {
  // Dev fallback — when SMTP is not configured, print the OTP to the server
  // console so you can still test the full registration flow locally.
  if (!smtpConfigured || !transporter) {
    console.log('─────────────────────────────────────────');
    console.log('[EMAIL SERVICE] SMTP not configured.');
    console.log(`  To  : ${to}`);
    console.log(`  OTP : ${otp}`);
    console.log('  (Set SMTP_HOST, SMTP_USER, SMTP_PASS in .env to send real emails)');
    console.log('─────────────────────────────────────────');
    return;
  }

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to,
    subject: 'SceneScribe — Verify your email',
    text: `Your SceneScribe verification code is: ${otp}\n\nThis code expires in 10 minutes. If you did not request this, please ignore this email.`,
    html: `
      <div style="font-family: sans-serif; max-width: 420px; margin: 0 auto; padding: 24px;">
        <h2 style="margin-bottom: 8px;">Verify your email</h2>
        <p style="color: #444; margin-bottom: 24px;">Use the code below to verify your SceneScribe account. It expires in <strong>10 minutes</strong>.</p>
        <div style="font-size: 36px; font-weight: bold; letter-spacing: 10px; text-align: center; padding: 24px 16px; background: #f4f4f4; border-radius: 8px;">
          ${otp}
        </div>
        <p style="color: #999; font-size: 13px; margin-top: 24px;">If you did not request this, you can safely ignore this email.</p>
      </div>
    `,
  });
}

module.exports = { sendOTPEmail };
