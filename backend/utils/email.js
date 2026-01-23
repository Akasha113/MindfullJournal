import nodemailer from 'nodemailer';

let transporter = null;

export const initializeEmailService = () => {
  console.log('🔧 Initializing email service...');
  console.log('GMAIL_USER:', process.env.GMAIL_USER);
  console.log('GMAIL_APP_PASSWORD set:', !!process.env.GMAIL_APP_PASSWORD);
  
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
  
  console.log('✅ Email transporter initialized');
};

export const sendVerificationEmail = async (email, code) => {
  if (!transporter) initializeEmailService();

  try {
    await transporter.sendMail({
      from: `Mindful Journal <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Verify Your Email - Mindful Journal',
      html: `
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
      from: `Mindful Journal <${process.env.GMAIL_USER}>`,
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
            <p style="color: #666666; font-size: 13px; margin: 15px 0;">
              This link will expire in 1 hour.
            </p>
            <p style="color: #999999; font-size: 12px;">
              If you did not request a password reset, please ignore this email.
            </p>
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
  if (!transporter) initializeEmailService();

  try {
    console.log('📧 Starting crisis alert email process...');
    console.log('📧 Admin email:', adminEmail);
    console.log('📧 User:', userDetails.name, '(' + userDetails.email + ')');
    console.log('📧 Transporter initialized:', !!transporter);

    const mailOptions = {
      from: `Mindful Journal <${process.env.GMAIL_USER}>`,
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
              <a href="http://localhost:5173/admin/dashboard" style="background: #333333; color: white; padding: 10px 25px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 13px; display: inline-block;">
                View in Admin Dashboard
              </a>
            </div>

            <div style="background: #ffffcc; padding: 15px; margin-top: 20px; border-left: 2px solid #ffcc00;">
              <p style="margin: 0; color: #333333; font-size: 13px;">
                <strong>ACTION REQUIRED:</strong> Please review this alert immediately. Contact the user, escalate to emergency services if necessary, or mark as false alarm.
              </p>
            </div>
          </div>

          <div style="padding: 15px; text-align: center; border-top: 1px solid #cccccc; font-size: 11px; color: #999999;">
            <p style="margin: 0;">© 2026 Mindful Journal. Crisis Alert System - Auto-generated</p>
          </div>
        </div>
      `,
    };

    console.log('📧 Email options created, sending now...');
    await transporter.sendMail(mailOptions);
    
    console.log('✅ Crisis alert email sent successfully to:', adminEmail);
    return true;
  } catch (error) {
    console.error('❌ Failed to send crisis alert email:', error);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    throw new Error('Failed to send crisis alert notification email: ' + error.message);
  }
};

export const sendAdminContactEmail = async (userEmail, userName, message) => {
  if (!transporter) initializeEmailService();

  try {
    console.log('📧 Sending admin contact message to:', userEmail);

    const mailOptions = {
      from: `Mindful Journal <${process.env.GMAIL_USER}>`,
      to: userEmail,
      subject: 'Support Message - Mindful Journal',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">
          <div style="padding: 20px; text-align: center; border-bottom: 1px solid #cccccc;">
            <h1 style="color: #000000; margin: 0; font-size: 24px;">Mindful Journal</h1>
            <p style="color: #666666; margin: 5px 0 0 0; font-size: 13px;">Your Mental Health Companion</p>
          </div>
          
          <div style="padding: 30px;">
            <h2 style="color: #333333; margin-top: 0; margin-bottom: 15px; font-size: 18px;">Hello ${userName},</h2>
            
            <p style="color: #333333; line-height: 1.6; margin-bottom: 15px; font-size: 14px;">
              We noticed you may be going through a difficult time, and we want you to know that we care about your wellbeing.
            </p>

            <div style="background: #f5f5f5; padding: 15px; margin: 20px 0; border-left: 2px solid #333333;">
              <p style="color: #333333; line-height: 1.6; margin: 0; font-style: italic; font-size: 13px;">
                ${message}
              </p>
            </div>

            <h3 style="color: #333333; margin: 20px 0 15px 0; font-size: 14px; border-bottom: 1px solid #cccccc; padding-bottom: 5px;">Support Resources Available:</h3>
            
            <div style="background: #f5f5f5; padding: 12px; margin-bottom: 12px; border-left: 2px solid #cc0000;">
              <p style="margin: 5px 0; color: #333333; font-weight: bold; font-size: 13px;">
                National Suicide Prevention Lifeline: <span style="font-size: 16px; color: #cc0000; font-weight: bold;">988</span>
              </p>
              <p style="margin: 5px 0; font-size: 12px; color: #666666;">Available 24/7 • Free and Confidential</p>
            </div>

            <div style="background: #f5f5f5; padding: 12px; margin-bottom: 12px; border-left: 2px solid #ff6600;">
              <p style="margin: 5px 0; color: #333333; font-weight: bold; font-size: 13px;">
                Crisis Text Line: Text <span style="background: white; padding: 1px 4px; font-family: monospace; font-weight: bold;">HOME</span> to <span style="background: white; padding: 1px 4px; font-family: monospace; font-weight: bold;">741741</span>
              </p>
              <p style="margin: 5px 0; font-size: 12px; color: #666666;">Available 24/7 • Free Confidential Support</p>
            </div>

            <div style="background: #f5f5f5; padding: 12px; border-left: 2px solid #333333;">
              <p style="margin: 5px 0; color: #333333; font-weight: bold; font-size: 13px;">
                International Association for Suicide Prevention
              </p>
              <p style="margin: 5px 0; font-size: 12px; color: #666666;">Visit: <a href="https://www.iasp.info/resources/Crisis_Centres/" style="color: #333333; text-decoration: none;">iasp.info/resources/Crisis_Centres</a></p>
            </div>

            <div style="background: #ffffcc; padding: 15px; margin-top: 20px; border-left: 2px solid #ffcc00;">
              <p style="color: #333333; margin: 0; font-size: 13px; line-height: 1.6;">
                <strong>Remember:</strong> Your life matters. You are not alone. Help is available right now. Please reach out to someone you trust or call one of the numbers above.
              </p>
            </div>

            <p style="color: #333333; line-height: 1.6; margin-top: 20px; font-size: 13px;">
              The Mindful Journal team cares about your wellbeing and is here to support you. We're always listening.
            </p>

            <p style="color: #999999; font-size: 12px; margin-top: 20px; border-top: 1px solid #cccccc; padding-top: 15px;">
              <strong>Need more help?</strong> You can reply to this email, and our team will read your message. Your safety and wellbeing are our top priority.
            </p>
          </div>

          <div style="padding: 15px; text-align: center; border-top: 1px solid #cccccc; font-size: 11px; color: #999999;">
            <p style="margin: 0;">© 2026 Mindful Journal. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Admin contact email sent successfully to:', userEmail);
    return true;
  } catch (error) {
    console.error('❌ Failed to send admin contact email:', error);
    throw new Error('Failed to send contact message: ' + error.message);
  }
};
