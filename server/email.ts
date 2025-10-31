import { Resend } from 'resend';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  return {apiKey: connectionSettings.settings.api_key, fromEmail: connectionSettings.settings.from_email};
}

async function getUncachableResendClient() {
  const {apiKey, fromEmail} = await getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail: fromEmail
  };
}

export async function sendCompanyServerIdEmail(companyData: {
  companyName: string;
  companyEmail: string;
  serverId: string;
}) {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Welcome to WorkLogix!</h2>
        <p>Dear ${companyData.companyName},</p>
        <p>Your company has been successfully registered on WorkLogix.</p>
        
        <div style="background-color: #f5f5f5; border-left: 4px solid #4CAF50; padding: 15px; margin: 20px 0;">
          <h3 style="color: #333; margin-top: 0;">Your Company Server ID:</h3>
          <p style="font-size: 24px; font-weight: bold; color: #4CAF50; margin: 10px 0;">${companyData.serverId}</p>
          <p style="color: #666; font-size: 14px; margin: 5px 0;">⚠️ Please save this ID securely. You will need it to log in to your company admin portal.</p>
        </div>
        
        <p>To access your company admin dashboard:</p>
        <ol>
          <li>Go to the WorkLogix login page</li>
          <li>Select "Company Admin" tab</li>
          <li>Enter your company name, email, server ID, and password</li>
        </ol>
        
        <p style="color: #666; font-size: 14px; margin-top: 30px;">Note: You can manage up to 10 users for free. Additional user slots can be purchased from your dashboard.</p>
        
        <p>Best regards,<br/>The WorkLogix Team</p>
      </div>
    `;

    await client.emails.send({
      from: fromEmail,
      to: companyData.companyEmail,
      subject: `WorkLogix - Your Company Server ID: ${companyData.serverId}`,
      html: htmlContent,
    });

    console.log(`Company Server ID email sent to ${companyData.companyEmail}`);
  } catch (error) {
    console.error('Error sending company server ID email:', error);
  }
}

export async function sendUserIdEmail(userData: {
  userName: string;
  userEmail: string;
  uniqueUserId: string;
  role: string;
}) {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Welcome to WorkLogix!</h2>
        <p>Dear ${userData.userName},</p>
        <p>Your account has been successfully created.</p>
        
        <div style="background-color: #f5f5f5; border-left: 4px solid #2196F3; padding: 15px; margin: 20px 0;">
          <h3 style="color: #333; margin-top: 0;">Your Unique User ID:</h3>
          <p style="font-size: 24px; font-weight: bold; color: #2196F3; margin: 10px 0;">${userData.uniqueUserId}</p>
          <p style="color: #666; font-size: 14px; margin: 5px 0;">⚠️ Please save this ID for your records. It is unique to your account.</p>
        </div>
        
        <p><strong>Your Role:</strong> ${userData.role === 'company_admin' ? 'Company Administrator' : 'Company Member'}</p>
        
        ${userData.role === 'company_admin' ? `
          <p>As a company administrator, you can:</p>
          <ul>
            <li>Manage users within your company</li>
            <li>Monitor user activity</li>
            <li>View company slot usage</li>
            <li>Purchase additional user slots when needed</li>
          </ul>
        ` : ''}
        
        <p>Best regards,<br/>The WorkLogix Team</p>
      </div>
    `;

    await client.emails.send({
      from: fromEmail,
      to: userData.userEmail,
      subject: `WorkLogix - Your User ID: ${userData.uniqueUserId}`,
      html: htmlContent,
    });

    console.log(`User ID email sent to ${userData.userEmail}`);
  } catch (error) {
    console.error('Error sending user ID email:', error);
  }
}

export async function sendPasswordResetEmail(data: {
  email: string;
  resetToken: string;
  userName?: string;
}) {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    
    const resetUrl = `${process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000'}/reset-password?token=${data.resetToken}`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>Dear ${data.userName || 'User'},</p>
        <p>We received a request to reset your password for your WorkLogix account.</p>
        
        <div style="background-color: #f5f5f5; border-left: 4px solid #FF9800; padding: 15px; margin: 20px 0;">
          <p style="color: #666; font-size: 14px; margin: 5px 0;">Click the button below to reset your password:</p>
          <a href="${resetUrl}" style="display: inline-block; background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; margin: 10px 0;">Reset Password</a>
          <p style="color: #999; font-size: 12px; margin: 10px 0;">Or copy this link: ${resetUrl}</p>
        </div>
        
        <p style="color: #666; font-size: 14px;">⚠️ This link will expire in 1 hour for security purposes.</p>
        <p style="color: #666; font-size: 14px;">If you didn't request this password reset, please ignore this email.</p>
        
        <p>Best regards,<br/>The WorkLogix Team</p>
      </div>
    `;

    await client.emails.send({
      from: fromEmail,
      to: data.email,
      subject: 'WorkLogix - Password Reset Request',
      html: htmlContent,
    });

    console.log(`Password reset email sent to ${data.email}`);
  } catch (error) {
    console.error('Error sending password reset email:', error);
  }
}

export async function sendPaymentConfirmationEmail(paymentData: {
  companyName: string;
  companyEmail: string;
  receiptNumber: string;
  amount: number;
  currency: string;
  slotType: string;
  slotQuantity: number;
  transactionId: string;
  paymentDate: Date;
}) {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    
    const currencySymbol = paymentData.currency === 'INR' ? '₹' : '$';
    const slotTypeLabel = paymentData.slotType === 'admin' ? 'Admin' : 'Member';
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="background-color: #4CAF50; color: white; width: 60px; height: 60px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 30px;">
              ✓
            </div>
            <h1 style="color: #333; margin: 15px 0 5px 0;">Payment Successful!</h1>
            <p style="color: #666; margin: 0;">Thank you for your purchase</p>
          </div>
          
          <div style="background-color: #f5f5f5; border-left: 4px solid #4CAF50; padding: 20px; margin: 25px 0; border-radius: 4px;">
            <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Payment Details</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666; width: 40%;">Receipt Number:</td>
                <td style="padding: 8px 0; color: #333; font-weight: bold;">${paymentData.receiptNumber}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Company:</td>
                <td style="padding: 8px 0; color: #333; font-weight: bold;">${paymentData.companyName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Date:</td>
                <td style="padding: 8px 0; color: #333;">${paymentData.paymentDate.toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' })}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Transaction ID:</td>
                <td style="padding: 8px 0; color: #333; font-size: 12px; word-break: break-all;">${paymentData.transactionId}</td>
              </tr>
            </table>
          </div>
          
          <div style="background-color: #f5f5f5; padding: 20px; margin: 25px 0; border-radius: 4px;">
            <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Order Summary</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666;">Item:</td>
                <td style="padding: 8px 0; color: #333; text-align: right;">${slotTypeLabel} Slots (${paymentData.slotQuantity})</td>
              </tr>
              <tr style="border-top: 1px solid #ddd;">
                <td style="padding: 12px 0; color: #333; font-weight: bold; font-size: 16px;">Total Amount:</td>
                <td style="padding: 12px 0; color: #4CAF50; font-weight: bold; font-size: 18px; text-align: right;">${currencySymbol}${paymentData.amount.toLocaleString()}</td>
              </tr>
            </table>
          </div>
          
          <div style="background-color: #E8F5E9; border: 1px solid #4CAF50; border-radius: 4px; padding: 15px; margin: 25px 0;">
            <p style="margin: 0; color: #2E7D32; font-size: 14px;">
              ✓ Your ${slotTypeLabel.toLowerCase()} slots have been added to your company account and are ready to use.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 14px; margin: 5px 0;">Questions about your payment?</p>
            <p style="color: #666; font-size: 14px; margin: 5px 0;">Contact us at support@worklogix.com</p>
          </div>
          
          <div style="text-align: center; margin-top: 25px;">
            <p style="color: #999; font-size: 12px; margin: 5px 0;">This is an automated email. Please do not reply.</p>
            <p style="color: #999; font-size: 12px; margin: 5px 0;">© ${new Date().getFullYear()} WorkLogix. All rights reserved.</p>
          </div>
        </div>
      </div>
    `;

    await client.emails.send({
      from: fromEmail,
      to: paymentData.companyEmail,
      subject: `Payment Receipt - ${paymentData.receiptNumber} | WorkLogix`,
      html: htmlContent,
    });

    console.log(`Payment confirmation email sent to ${paymentData.companyEmail} with receipt ${paymentData.receiptNumber}`);
    return true;
  } catch (error) {
    console.error('Error sending payment confirmation email:', error);
    return false;
  }
}

export async function sendReportNotification(reportData: {
  userName: string;
  reportType: string;
  plannedTasks?: string | null;
  completedTasks?: string | null;
  pendingTasks?: string | null;
  notes?: string | null;
  createdAt: Date;
}) {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New ${reportData.reportType.charAt(0).toUpperCase() + reportData.reportType.slice(1)} Report Submitted</h2>
        <p><strong>User:</strong> ${reportData.userName}</p>
        <p><strong>Report Type:</strong> ${reportData.reportType.charAt(0).toUpperCase() + reportData.reportType.slice(1)}</p>
        <p><strong>Submitted At:</strong> ${reportData.createdAt.toLocaleString()}</p>
        
        ${reportData.plannedTasks ? `
          <div style="margin: 20px 0;">
            <h3 style="color: #555;">Planned Tasks:</h3>
            <p style="white-space: pre-wrap;">${reportData.plannedTasks}</p>
          </div>
        ` : ''}
        
        ${reportData.completedTasks ? `
          <div style="margin: 20px 0;">
            <h3 style="color: #555;">Completed Tasks:</h3>
            <p style="white-space: pre-wrap;">${reportData.completedTasks}</p>
          </div>
        ` : ''}
        
        ${reportData.pendingTasks ? `
          <div style="margin: 20px 0;">
            <h3 style="color: #555;">Pending Tasks:</h3>
            <p style="white-space: pre-wrap;">${reportData.pendingTasks}</p>
          </div>
        ` : ''}
        
        ${reportData.notes ? `
          <div style="margin: 20px 0;">
            <h3 style="color: #555;">Notes:</h3>
            <p style="white-space: pre-wrap;">${reportData.notes}</p>
          </div>
        ` : ''}
      </div>
    `;

    await client.emails.send({
      from: fromEmail,
      to: 'maniselvam2023@gmail.com',
      subject: `New ${reportData.reportType.charAt(0).toUpperCase() + reportData.reportType.slice(1)} Report - ${reportData.userName}`,
      html: htmlContent,
    });

    console.log(`Email sent successfully for ${reportData.reportType} report by ${reportData.userName}`);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}
