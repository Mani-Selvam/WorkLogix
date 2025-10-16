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
