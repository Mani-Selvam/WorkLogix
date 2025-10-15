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
