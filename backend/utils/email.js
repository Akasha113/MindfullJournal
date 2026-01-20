import nodemailer from 'nodemailer';

let transporter = null;

export const initializeEmailService = () => {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
};

export const sendVerificationEmail = async (email, code) => {
  if (!transporter) initializeEmailService();

  try {
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: email,
      subject: 'Mindful Journal - Email Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #6E2B8A 0%, #a323af 100%); padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">Mindful Journal</h1>
            <p style="color: white; margin: 5px 0 0 0;">Mindful Journal</p>
          </div>
          <div style="background: #f9f5fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #6E2B8A; margin-bottom: 10px;">Email Verification</h2>
            <p style="color: #333; line-height: 1.6;">
              Thank you for registering with Mindful Journal! To complete your registration, please use the following verification code:
            </p>
            <div style="background: white; border: 2px solid #e8c8eb; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
              <p style="font-size: 36px; font-weight: bold; color: #6E2B8A; letter-spacing: 5px; margin: 0;">${code}</p>
            </div>
            <p style="color: #666; font-size: 14px; margin-bottom: 10px;">
              This code will expire in 1 minute.
            </p>
            <p style="color: #999; font-size: 12px;">
              If you did not register for a Mindful Journal account, please ignore this email.
            </p>
          </div>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    throw new Error('Failed to send verification email');
  }
};

export const sendPasswordResetEmail = async (email, resetLink) => {
  if (!transporter) initializeEmailService();

  try {
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: email,
      subject: 'Mindful Journal - Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #6E2B8A 0%, #a323af 100%); padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">Mindful Journal</h1>
            <p style="color: white; margin: 5px 0 0 0;">Password Reset Request</p>
          </div>
          <div style="background: #f9f5fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #6E2B8A; margin-bottom: 10px;">Password Reset Request</h2>
            <p style="color: #333; line-height: 1.6;">
              We received a request to reset your password. Click the link below to create a new password:
            </p>
            <div style="margin: 20px 0;">
              <a href="${resetLink}" style="background: linear-gradient(135deg, #6E2B8A 0%, #a323af 100%); color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; display: inline-block; font-weight: bold;">
                Reset Password
              </a>
            </div>
            <p style="color: #666; font-size: 14px; margin-bottom: 10px;">
              This link will expire in 1 hour.
            </p>
            <p style="color: #999; font-size: 12px;">
              If you did not request a password reset, please ignore this email.
            </p>
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
