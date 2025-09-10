// Mock email service for demonstration purposes
// In production, you would use a real email service like SendGrid, Mailgun, etc.

export interface EmailTemplate {
  to: string
  subject: string
  html: string
  text: string
}

interface ConfirmationToken {
  token: string
  email: string
  expiresAt: number
  createdAt: number
}

// Store confirmation tokens
const getStoredTokens = (): ConfirmationToken[] => {
  try {
    const tokens = localStorage.getItem("recruitify-confirmation-tokens")
    return tokens ? JSON.parse(tokens) : []
  } catch (err) {
    console.error("Error getting stored tokens:", err)
    return []
  }
}

const storeToken = (tokenData: ConfirmationToken) => {
  try {
    const tokens = getStoredTokens()
    tokens.push(tokenData)
    localStorage.setItem("recruitify-confirmation-tokens", JSON.stringify(tokens))
  } catch (err) {
    console.error("Error storing token:", err)
  }
}

const findToken = (token: string): ConfirmationToken | null => {
  const tokens = getStoredTokens()
  return tokens.find((t) => t.token === token) || null
}

// Store sent emails for demo purposes
const getStoredEmails = (): any[] => {
  try {
    const emails = localStorage.getItem("recruitify-sent-emails")
    return emails ? JSON.parse(emails) : []
  } catch (err) {
    console.error("Error getting stored emails:", err)
    return []
  }
}

const storeEmail = (emailData: any) => {
  try {
    const emails = getStoredEmails()
    emails.unshift(emailData) // Add to beginning
    localStorage.setItem("recruitify-sent-emails", JSON.stringify(emails))
  } catch (err) {
    console.error("Error storing email:", err)
  }
}

export const sendConfirmationEmail = async (
  email: string,
  name: string,
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Generate confirmation token
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36)
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000 // 24 hours

    // Store token
    const tokenData: ConfirmationToken = {
      token,
      email,
      expiresAt,
      createdAt: Date.now(),
    }
    storeToken(tokenData)

    // Create confirmation URL
    const confirmationUrl = `${window.location.origin}/confirm-email?token=${token}&email=${encodeURIComponent(email)}`

    // Create email template
    const emailTemplate: EmailTemplate = {
      to: email,
      subject: "Confirm Your Recruitify Account",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Confirm Your Recruitify Account</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #0d9488; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .logo { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">RECRUITIFY</div>
            <p>Welcome to the future of recruitment!</p>
          </div>
          <div class="content">
            <h2>Welcome to Recruitify!</h2>
            <p>Hi ${name},</p>
            <p>Thank you for signing up for Recruitify! We're excited to help you find the best talent for your organization.</p>
            <p>To get started, please confirm your email address by clicking the button below:</p>
            <div style="text-align: center;">
              <a href="${confirmationUrl}" class="button">Confirm My Account</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #e5e7eb; padding: 10px; border-radius: 4px; font-family: monospace;">
              ${confirmationUrl}
            </p>
            <p><strong>This link will expire in 24 hours.</strong></p>
            <p>If you didn't create an account with Recruitify, you can safely ignore this email.</p>
            <p>Best regards,<br>The Recruitify Team</p>
          </div>
          <div class="footer">
            <p>© 2024 Recruitify. All rights reserved.</p>
          </div>
        </body>
        </html>
      `,
      text: `
        Welcome to Recruitify!
        
        Hi ${name},
        
        Thank you for signing up for Recruitify! We're excited to help you find the best talent for your organization.
        
        To get started, please confirm your email address by visiting this link:
        ${confirmationUrl}
        
        This link will expire in 24 hours.
        
        If you didn't create an account with Recruitify, you can safely ignore this email.
        
        Best regards,
        The Recruitify Team
      `,
    }

    // Store email for demo purposes
    const emailData = {
      id: `email_${Date.now()}`,
      ...emailTemplate,
      confirmationUrl,
      token,
      sentAt: new Date().toISOString(),
      status: "sent",
    }
    storeEmail(emailData)

    // Log email to console (simulating email sending)
    console.log("📧 MOCK EMAIL SENT:")
    console.log("To:", email)
    console.log("Subject:", emailTemplate.subject)
    console.log("Confirmation URL:", confirmationUrl)
    console.log("Token:", token)
    console.log("Full Email HTML:", emailTemplate.html)

    return { success: true }
  } catch (error: any) {
    console.error("Error sending confirmation email:", error)
    return { success: false, error: error.message || "Failed to send confirmation email" }
  }
}

export const verifyConfirmationToken = (token: string, email: string): { valid: boolean; error?: string } => {
  try {
    const tokenData = findToken(token)

    if (!tokenData) {
      return { valid: false, error: "Invalid confirmation token" }
    }

    if (tokenData.email !== email) {
      return { valid: false, error: "Token does not match email address" }
    }

    if (Date.now() > tokenData.expiresAt) {
      return { valid: false, error: "Confirmation token has expired" }
    }

    return { valid: true }
  } catch (error) {
    console.error("Error verifying token:", error)
    return { valid: false, error: "Failed to verify token" }
  }
}

export const getSentEmails = (): any[] => {
  return getStoredEmails()
}

export const resendConfirmationEmail = async (email: string): Promise<{ success: boolean; error?: string }> => {
  try {
    // Find user to get name
    const users = JSON.parse(localStorage.getItem("recruitify-users") || "[]")
    const user = users.find((u: any) => u.email === email)

    if (!user) {
      return { success: false, error: "User not found" }
    }

    return await sendConfirmationEmail(email, user.name)
  } catch (error: any) {
    console.error("Error resending confirmation email:", error)
    return { success: false, error: error.message || "Failed to resend confirmation email" }
  }
}

// Simple email function as requested - for basic email sending
export async function sendEmail(to: string, subject: string, body: string): Promise<string> {
  try {
    console.log("📧 Sending email:")
    console.log("To:", to)
    console.log("Subject:", subject) 
    console.log("Body:", body)
    
    // Store email for demo purposes
    const emailData = {
      id: `email_${Date.now()}`,
      to,
      subject,
      body,
      sentAt: new Date().toISOString(),
      status: "sent"
    }
    
    storeEmail(emailData)
    
    return Promise.resolve("Email sent (placeholder)")
  } catch (error) {
    console.error("Error sending email:", error)
    return Promise.resolve("Email failed (placeholder)")
  }
}
