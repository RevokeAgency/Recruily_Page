// Email service for Recruily application

export async function sendEmail(to: string, subject: string, html: string) {
  // Mock email service implementation
  console.log(`Sending email to: ${to}, Subject: ${subject}`)
  return { success: true, messageId: `mock-${Date.now()}` }
}

export function verifyConfirmationToken(token: string, email: string) {
  // Mock verification logic
  if (!token || !email) {
    return { valid: false, error: "Token or email missing" }
  }
  
  // In a real implementation, you would verify the token against a database
  if (token.length < 10) {
    return { valid: false, error: "Invalid token format" }
  }
  
  return { valid: true }
}

export async function resendConfirmationEmail(email: string) {
  // Mock resend logic
  if (!email) {
    return { success: false, error: "Email is required" }
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { success: false, error: "Invalid email format" }
  }
  
  // Mock sending confirmation email
  await sendEmail(
    email,
    "Confirm your email address",
    `<p>Please click the link to confirm your email address.</p>`
  )
  
  return { success: true }
}