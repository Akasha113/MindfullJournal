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

export const sendCrisisAlertEmail = async (adminEmail, userDetails, crisisAlert) => {
  if (!transporter) initializeEmailService();

  try {
    console.log('📧 Starting crisis alert email process...');
    console.log('📧 Admin email:', adminEmail);
    console.log('📧 User:', userDetails.name, '(' + userDetails.email + ')');
    console.log('📧 Transporter initialized:', !!transporter);

    const riskColors = {
      critical: '#dc2626',
      high: '#ea580c',
      medium: '#eab308',
      low: '#16a34a',
    };

    const riskColor = riskColors[crisisAlert.riskLevel] || '#dc2626';

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: adminEmail,
      subject: `🚨 CRISIS ALERT - ${crisisAlert.riskLevel.toUpperCase()} RISK - ${userDetails.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #6E2B8A 0%, #a323af 100%); padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">🚨 Crisis Alert Notification</h1>
            <p style="color: white; margin: 5px 0 0 0;">Mindful Journal Admin</p>
          </div>
          
          <div style="background: #fff5f5; padding: 20px; border-left: 5px solid ${riskColor};">
            <h2 style="color: ${riskColor}; margin: 0 0 15px 0;">Risk Level: ${crisisAlert.riskLevel.toUpperCase()}</h2>
            
            <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px; border: 1px solid #fee2e2;">
              <h3 style="color: #333; margin-top: 0;">User Information</h3>
              <p><strong>Name:</strong> ${userDetails.name}</p>
              <p><strong>Email:</strong> ${userDetails.email}</p>
              <p><strong>User ID:</strong> ${userDetails._id}</p>
              <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            </div>

            <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px; border: 1px solid #fee2e2;">
              <h3 style="color: #333; margin-top: 0;">Crisis Message</h3>
              <p style="background: #f5f5f5; padding: 10px; border-radius: 5px; border-left: 3px solid ${riskColor}; color: #333; font-style: italic;">
                "${crisisAlert.content}"
              </p>
            </div>

            <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px; border: 1px solid #fee2e2;">
              <h3 style="color: #333; margin-top: 0;">Alert Details</h3>
              <p><strong>Content Type:</strong> ${crisisAlert.contentType}</p>
              <p><strong>Risk Score:</strong> ${(crisisAlert.riskScore * 100).toFixed(1)}%</p>
              <p><strong>Detected Keywords:</strong> ${crisisAlert.detectedKeywords.join(', ') || 'None'}</p>
              <p><strong>Risk Factors:</strong> ${crisisAlert.riskFactors.join(', ') || 'None'}</p>
            </div>

            <div style="margin-top: 20px; text-align: center;">
              <a href="http://localhost:5173/admin/dashboard" style="background: linear-gradient(135deg, #6E2B8A 0%, #a323af 100%); color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; display: inline-block; font-weight: bold; font-size: 16px;">
                View in Admin Dashboard
              </a>
            </div>

            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin-top: 15px; border-left: 4px solid #f59e0b;">
              <p style="margin: 0; color: #92400e; font-size: 14px;">
                <strong>⚠️ ACTION REQUIRED:</strong> Please review this alert immediately and take appropriate action. Contact the user, escalate to emergency services if necessary, or mark as false alarm.
              </p>
            </div>
          </div>

          <div style="background: #f3f4f6; padding: 15px; border-radius: 0 0 10px 10px; font-size: 12px; color: #666; text-align: center;">
            <p>Mindful Journal Crisis Alert System | Auto-generated notification</p>
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
