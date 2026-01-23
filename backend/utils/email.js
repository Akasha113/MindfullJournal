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

export const sendAdminContactEmail = async (userEmail, userName, message) => {
  if (!transporter) initializeEmailService();

  try {
    console.log('📧 Sending admin contact message to:', userEmail);

    const mailOptions = {
      from: `Akasha Iqbal - Mindful Journal <${process.env.GMAIL_USER}>`,
      to: userEmail,
      subject: '🤝 Mindful Journal - Support Message From Akasha Iqbal',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #6E2B8A 0%, #a323af 100%); padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">💜 Mindful Journal</h1>
            <p style="color: white; margin: 5px 0 0 0;">We Care About Your Wellbeing</p>
          </div>
          
          <div style="background: #f9f5fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #6E2B8A; margin-top: 0;">Hello ${userName},</h2>
            
            <p style="color: #333; line-height: 1.8; margin: 20px 0;">
              We noticed you may be going through a difficult time, and we want you to know that <strong>we care about your wellbeing</strong>.
            </p>

            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6E2B8A;">
              <p style="color: #333; line-height: 1.8; margin: 0; font-style: italic;">
                ${message}
              </p>
            </div>

            <h3 style="color: #6E2B8A; margin-top: 25px; margin-bottom: 15px;">🆘 Immediate Support Resources:</h3>
            
            <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #dc2626;">
              <p style="margin: 5px 0; color: #333;">
                <strong>National Suicide Prevention Lifeline:</strong> <span style="font-size: 18px; color: #6E2B8A; font-weight: bold;">988</span>
              </p>
              <p style="margin: 5px 0; font-size: 12px; color: #666;">Available 24/7 • Free and Confidential</p>
            </div>

            <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #ea580c;">
              <p style="margin: 5px 0; color: #333;">
                <strong>Crisis Text Line:</strong> Text <span style="background: #f5f5f5; padding: 2px 8px; border-radius: 4px; font-weight: bold;">HOME</span> to <span style="background: #f5f5f5; padding: 2px 8px; border-radius: 4px; font-weight: bold;">741741</span>
              </p>
              <p style="margin: 5px 0; font-size: 12px; color: #666;">Available 24/7 • Free Confidential Support</p>
            </div>

            <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #eab308;">
              <p style="margin: 5px 0; color: #333;">
                <strong>International Association for Suicide Prevention:</strong>
              </p>
              <p style="margin: 5px 0; font-size: 12px; color: #666;">Visit: <a href="https://www.iasp.info/resources/Crisis_Centres/" style="color: #6E2B8A;">iasp.info/resources/Crisis_Centres</a></p>
            </div>

            <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin-top: 25px; border-left: 4px solid #6E2B8A;">
              <p style="color: #0369a1; margin: 0;">
                <strong>💚 Remember:</strong> Your life matters. You are not alone. Help is available right now, and recovery is possible. Please reach out to someone you trust or call the numbers above.
              </p>
            </div>

            <p style="color: #666; line-height: 1.8; margin-top: 25px;">
              The Mindful Journal team cares about your wellbeing and is here to support you on your mental health journey.
            </p>

            <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
              <strong>Need more help?</strong> You can reply to this email, and our team will read your message. Your safety and wellbeing are our top priority.
            </p>
          </div>

          <div style="background: #f3f4f6; padding: 15px; border-radius: 0; font-size: 11px; color: #666; text-align: center;">
            <p style="margin: 0;">Mindful Journal - Supporting Your Mental Health</p>
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
