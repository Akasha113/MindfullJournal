import nodemailer from 'nodemailer';
import fetch from 'node-fetch';
import { Resend } from 'resend';

let transporter = null;
let emailServiceReady = false;
let resendClient = null;

export const initializeEmailService = () => {
  console.log('🔧 Initializing email service...');
  console.log('GMAIL_USER:', process.env.GMAIL_USER);
  console.log('GMAIL_APP_PASSWORD length:', process.env.GMAIL_APP_PASSWORD?.length || 0, 'characters');

  // Initialize Resend if API key is available
  if (process.env.RESEND_API_KEY) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
    console.log('✅ Resend client initialized');
  } else {
    console.warn('⚠️ RESEND_API_KEY not set - Resend will not be used');
  }

  // Check for spaces in password (common mistake)
  if (process.env.GMAIL_APP_PASSWORD && process.env.GMAIL_APP_PASSWORD.includes(' ')) {
    console.error('❌ CRITICAL: Gmail app password contains SPACES!');
    console.error('⚠️  Remove all spaces from the password in backend/.env');
    emailServiceReady = false;
    return;
  }

  // Validate required Gmail environment variables
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.error('❌ Missing Gmail credentials: please set GMAIL_USER and GMAIL_APP_PASSWORD');
    emailServiceReady = false;
    return;
  }

  try {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: true,
      },
    });

    console.log('✅ Email transporter initialized');
    emailServiceReady = true;
  } catch (error) {
    console.error('❌ Failed to initialize email transporter:', error.message);
    emailServiceReady = false;
  }
};

export const isEmailServiceReady = () => emailServiceReady;

// ---
// Send via Resend (primary - works on Railway)
// ✅ FIX: Use verified domain mindfuljournal.it.com as the from address
// ---
const sendViaResend = async (to, subject, html) => {
  if (!resendClient) return false;

  try {
    // ✅ FIXED: Use your verified domain instead of onboarding@resend.dev
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@mindfuljournal.it.com';
    const { data, error } = await resendClient.emails.send({
      from: `Mindful Journal <${fromEmail}>`,
      to,
      subject,
      html,
    });

    if (error) {
      console.error('❌ Resend error:', error);
      return false;
    }

    console.log('✅ Email sent via Resend to', to);
    return true;
  } catch (err) {
    console.error('❌ Resend request failed:', err);
    return false;
  }
};

// ---
// Fallback using SendGrid HTTP API
// ---
const sendViaSendGrid = async (to, subject, html) => {
  const key = process.env.SENDGRID_API_KEY;
  if (!key) return false;

  try {
    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: process.env.GMAIL_USER || 'no-reply@mindfuljournal.it.com' },
        subject,
        content: [{ type: 'text/html', value: html }],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('❌ SendGrid error:', res.status, text);
      return false;
    }
    console.log('✅ Email sent via SendGrid to', to);
    return true;
  } catch (err) {
    console.error('❌ SendGrid request failed:', err);
    return false;
  }
};

// ---
// Main send helper - tries Resend first, then Gmail, then SendGrid
// ---
const sendMail = async (mailOptions) => {
  // 1. Try Resend first (works on Railway)
  const sentViaResend = await sendViaResend(
    mailOptions.to,
    mailOptions.subject,
    mailOptions.html
  );
  if (sentViaResend) return true;

  // 2. Try Gmail
  if (transporter && emailServiceReady) {
    try {
      await transporter.sendMail(mailOptions);
      console.log('✅ Gmail sendMail success for:', mailOptions.to);
      return true;
    } catch (err) {
      console.error('❌ Gmail send failed:', err);
      console.error('❌ Gmail send failed (message):', err.message);
      console.error('❌ Gmail send failed (code):', err.code);
    }
  }

  // 3. Try SendGrid as last resort
  const sentViaSG = await sendViaSendGrid(
    mailOptions.to,
    mailOptions.subject,
    mailOptions.html
  );
  if (sentViaSG) return true;

  return false;
};

export const sendVerificationEmail = async (email, code) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="padding: 20px; text-align: center; border-bottom: 1px solid #cccccc;">
        <h1 style="color: #000000; margin: 0; font-size: 24px;">Mindful Journal</h1>
      </div>
      <div style="padding: 30px;">
        <p style="color: #333333; line-height: 1.6; font-size: 14px;">
          Thank you for signing up with Mindful Journal. To complete your registration, please use the following verification code:
        </p>
        <div style="background: #f5f5f5; border: 1px solid #cccccc; border-radius: 4px; padding: 20px; text-align: center; margin: 20px 0;">
          <p style="font-size: 36px; font-weight: bold; color: #000000; letter-spacing: 8px; margin: 0; font-family: monospace;">${code}</p>
        </div>
        <p style="color: #666666; font-size: 13px; margin: 15px 0;">
          This verification code will expire in 10 minutes.
        </p>
        <p style="color: #999999; font-size: 12px;">
          If you did not create this account, please ignore this email.
        </p>
      </div>
      <div style="padding: 15px; text-align: center; border-top: 1px solid #cccccc; font-size: 11px; color: #999999;">
        <p style="margin: 0;">© 2026 Mindful Journal. All rights reserved.</p>
      </div>
    </div>
  `;

  try {
    const sent = await sendMail({
      from: `Mindful Journal <noreply@mindfuljournal.it.com>`,
      to: email,
      subject: 'Verify Your Email - Mindful Journal',
      html,
    });

    if (!sent) {
      console.error('❌ Verification email failed to send to', email);
      return false;
    }
    return true;
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
};

export const sendPasswordResetEmail = async (email, resetLink) => {
  try {
    const sent = await sendMail({
      from: `Mindful Journal <noreply@mindfuljournal.it.com>`,
      to: email,
      subject: 'Reset Your Password - Mindful Journal',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="padding: 20px; text-align: center; border-bottom: 1px solid #cccccc;">
            <h1 style="color: #000000; margin: 0; font-size: 24px;">Mindful Journal</h1>
          </div>
          <div style="padding: 30px;">
            <h2 style="color: #333333; margin-bottom: 15px; font-size: 18px;">Password Reset Request</h2>
            <p style="color: #333333; line-height: 1.6; font-size: 14px;">
              We received a request to reset your password. Click the button below to create a new password:
            </p>
            <div style="text-align: center; margin: 25px 0;">
              <a href="${resetLink}" style="background: #333333; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 14px; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p style="color: #666666; font-size: 13px; margin: 15px 0;">
              Or copy and paste this link: <br/>
              <span style="word-break: break-all; font-family: monospace; font-size: 12px; color: #333333;">${resetLink}</span>
            </p>
            <p style="color: #666666; font-size: 13px; margin: 15px 0;">This link will expire in 1 hour.</p>
            <p style="color: #999999; font-size: 12px;">If you did not request a password reset, please ignore this email.</p>
          </div>
          <div style="padding: 15px; text-align: center; border-top: 1px solid #cccccc; font-size: 11px; color: #999999;">
            <p style="margin: 0;">© 2026 Mindful Journal. All rights reserved.</p>
          </div>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    throw new Error('Failed to send password reset email');
  }
};

export const sendCrisisAlertEmail = async (adminEmail, userDetails, crisisAlert) => {
  try {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5175';
    const returnUrl = `/admin/crisis-alerts/${crisisAlert._id}`;
    const alertUrl = `${frontendUrl}/admin/login?returnUrl=${encodeURIComponent(returnUrl)}`;

    const sent = await sendMail({
      from: `Mindful Journal <noreply@mindfuljournal.it.com>`,
      to: adminEmail,
      subject: `CRISIS ALERT - ${crisisAlert.riskLevel.toUpperCase()} RISK - ${userDetails.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">
          <div style="padding: 20px; text-align: center; border-bottom: 1px solid #cccccc;">
            <h1 style="color: #000000; margin: 0; font-size: 24px;">CRISIS ALERT NOTIFICATION</h1>
            <p style="color: #666666; margin: 5px 0 0 0; font-size: 13px;">Mindful Journal - Admin Dashboard</p>
          </div>
          <div style="padding: 30px;">
            <h2 style="color: #cc0000; margin: 0 0 20px 0; font-size: 18px;">Risk Level: ${crisisAlert.riskLevel.toUpperCase()}</h2>
            <p style="color: #333333; margin: 0 0 10px 0; font-size: 13px;"><strong>Risk Score:</strong> ${(crisisAlert.riskScore * 100).toFixed(1)}%</p>
            <h3 style="color: #333333; margin: 20px 0 10px 0; font-size: 14px; border-bottom: 1px solid #cccccc; padding-bottom: 5px;">User Information</h3>
            <p style="color: #333333; margin: 5px 0; font-size: 13px;"><strong>Name:</strong> ${userDetails.name}</p>
            <p style="color: #333333; margin: 5px 0; font-size: 13px;"><strong>Email:</strong> ${userDetails.email}</p>
            <p style="color: #333333; margin: 5px 0; font-size: 13px;"><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            <h3 style="color: #333333; margin: 20px 0 10px 0; font-size: 14px; border-bottom: 1px solid #cccccc; padding-bottom: 5px;">Crisis Message</h3>
            <p style="color: #333333; margin: 0; font-size: 13px; background: #f5f5f5; padding: 10px; border-left: 2px solid #cc0000; font-style: italic;">
              "${crisisAlert.content}"
            </p>
            <h3 style="color: #333333; margin: 20px 0 10px 0; font-size: 14px; border-bottom: 1px solid #cccccc; padding-bottom: 5px;">Alert Details</h3>
            <p style="color: #333333; margin: 5px 0; font-size: 13px;"><strong>Type:</strong> ${crisisAlert.contentType}</p>
            <p style="color: #333333; margin: 5px 0; font-size: 13px;"><strong>Keywords:</strong> ${crisisAlert.detectedKeywords.join(', ') || 'None'}</p>
            <p style="color: #333333; margin: 5px 0; font-size: 13px;"><strong>Risk Factors:</strong> ${crisisAlert.riskFactors.join(', ') || 'None'}</p>
            <div style="text-align: center; margin: 25px 0;">
              <a href="${alertUrl}" style="background: #333333; color: white; padding: 10px 25px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 13px; display: inline-block;">
                Login & View Alert Details
              </a>
            </div>
            <div style="background: #ffffcc; padding: 15px; margin-top: 20px; border-left: 2px solid #ffcc00;">
              <p style="margin: 0; color: #333333; font-size: 13px;">
                <strong>ACTION REQUIRED:</strong> Please review this alert immediately.
              </p>
            </div>
          </div>
          <div style="padding: 15px; text-align: center; border-top: 1px solid #cccccc; font-size: 11px; color: #999999;">
            <p style="margin: 0;">© 2026 Mindful Journal. Crisis Alert System - Auto-generated</p>
          </div>
        </div>
      `,
    });

    if (!sent) {
      console.error('❌ Unable to deliver crisis alert email via any provider');
      throw new Error('Failed to send crisis alert notification email');
    }

    console.log('✅ Crisis alert email sent successfully to:', adminEmail);
    return true;
  } catch (error) {
    console.error('❌ Failed to send crisis alert email:', error);
    throw new Error('Failed to send crisis alert notification email: ' + error.message);
  }
};

export const sendAdminContactEmail = async (userEmail, userName, message) => {
  try {
    const sent = await sendMail({
      from: `Mindful Journal <noreply@mindfuljournal.it.com>`,
      to: userEmail,
      subject: 'Support Message - Mindful Journal',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">
          <div style="padding: 20px; text-align: center; border-bottom: 1px solid #cccccc;">
            <h1 style="color: #000000; margin: 0; font-size: 24px;">Mindful Journal</h1>
          </div>
          <div style="padding: 30px;">
            <h2 style="color: #333333; margin-top: 0; font-size: 18px;">Hello ${userName},</h2>
            <p style="color: #333333; line-height: 1.6; font-size: 14px;">
              We noticed you may be going through a difficult time, and we want you to know that we care about your wellbeing.
            </p>
            <div style="background: #f5f5f5; padding: 15px; margin: 20px 0; border-left: 2px solid #333333;">
              <p style="color: #333333; line-height: 1.6; margin: 0; font-style: italic; font-size: 13px;">${message}</p>
            </div>
            <h3 style="color: #333333; margin: 20px 0 15px 0; font-size: 14px; border-bottom: 1px solid #cccccc; padding-bottom: 5px;">Support Resources Available:</h3>
            <div style="background: #f5f5f5; padding: 12px; margin-bottom: 12px; border-left: 2px solid #cc0000;">
              <p style="margin: 5px 0; color: #333333; font-weight: bold; font-size: 13px;">
                National Suicide Prevention Lifeline: <span style="font-size: 16px; color: #cc0000; font-weight: bold;">988</span>
              </p>
              <p style="margin: 5px 0; font-size: 12px; color: #666666;">Available 24/7 • Free and Confidential</p>
            </div>
            <div style="background: #f5f5f5; padding: 12px; border-left: 2px solid #333333;">
              <p style="margin: 5px 0; color: #333333; font-weight: bold; font-size: 13px;">Crisis Text Line: Text HOME to 741741</p>
              <p style="margin: 5px 0; font-size: 12px; color: #666666;">Available 24/7 • Free Confidential Support</p>
            </div>
            <div style="background: #ffffcc; padding: 15px; margin-top: 20px; border-left: 2px solid #ffcc00;">
              <p style="color: #333333; margin: 0; font-size: 13px; line-height: 1.6;">
                <strong>Remember:</strong> Your life matters. You are not alone. Help is available right now.
              </p>
            </div>
          </div>
          <div style="padding: 15px; text-align: center; border-top: 1px solid #cccccc; font-size: 11px; color: #999999;">
            <p style="margin: 0;">© 2026 Mindful Journal. All rights reserved.</p>
          </div>
        </div>
      `,
    });

    if (!sent) {
      console.error('❌ Admin contact email failed via all providers');
      return false;
    }
    console.log('✅ Admin contact email sent successfully to:', userEmail);
    return true;
  } catch (error) {
    console.error('❌ Failed to send admin contact email:', error);
    return false;
  }
};