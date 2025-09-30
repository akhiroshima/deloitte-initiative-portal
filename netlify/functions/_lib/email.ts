import { Resend } from 'resend';

let resend: Resend | null = null;

function getResendClient(): Resend {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }
    resend = new Resend(apiKey);
  }
  return resend;
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async (options: EmailOptions) => {
  try {
    const resendClient = getResendClient();
    const { data, error } = await resendClient.emails.send({
      from: 'Acme <onboarding@resend.dev>',
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    if (error) {
      console.error('Email send error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      throw new Error(`Failed to send email: ${error.message || 'Unknown error'}`);
    }

    return data;
  } catch (error) {
    console.error('Email service error:', error);
    throw error;
  }
};

export const generatePassword = (): string => {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  
  // Ensure at least one character from each required type
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // Uppercase
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // Lowercase
  password += '0123456789'[Math.floor(Math.random() * 10)]; // Number
  password += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // Special char
  
  // Fill the rest randomly
  for (let i = 4; i < 12; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

export const createPasswordEmail = (username: string, password: string): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Deloitte Initiative Portal</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1e40af; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .password-box { background: #1e40af; color: white; padding: 15px; border-radius: 6px; text-align: center; margin: 20px 0; font-family: monospace; font-size: 18px; letter-spacing: 2px; }
        .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Deloitte Initiative Portal</h1>
        </div>
        <div class="content">
          <h2>Hello ${username}!</h2>
          <p>Your account has been successfully created. Here are your login credentials:</p>
          
          <div class="password-box">
            <strong>Your temporary password:</strong><br>
            ${password}
          </div>
          
          <div class="warning">
            <strong>⚠️ Important Security Notice:</strong><br>
            This is a temporary password. You will be required to change it on your first login for security reasons.
          </div>
          
          <p>You can now access the Deloitte Initiative Portal at:</p>
          <p><a href="https://deloitte-initiative-portal.netlify.app" style="color: #1e40af; text-decoration: none; font-weight: bold;">https://deloitte-initiative-portal.netlify.app</a></p>
          
          <p>If you have any questions or need assistance, please contact your system administrator.</p>
        </div>
        <div class="footer">
          <p>This is an automated message from Deloitte Initiative Portal</p>
        </div>
      </div>
    </body>
    </html>
  `;
};
