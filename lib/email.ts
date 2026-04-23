import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = 'Sabitek <noreply@sabitek.school>'

export async function sendSubscriptionReceiptEmail({
  to,
  userName,
  planName,
  amount,
  currency,
  transactionRef,
  billingPeriodEnd,
}: {
  to: string
  userName: string
  planName: string
  amount: number
  currency: string
  transactionRef: string
  billingPeriodEnd: Date
}) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Welcome to Sabitek ${planName}! 🎉`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1a1a1a; margin-bottom: 5px;">Sabitek<span style="color: #ef4444;">✦</span></h1>
          </div>
          
          <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
            <h2 style="margin: 0 0 10px 0; font-size: 24px;">Payment Successful!</h2>
            <p style="margin: 0; opacity: 0.9;">Welcome to ${planName}</p>
          </div>
          
          <p>Hi ${userName},</p>
          
          <p>Thank you for subscribing to <strong>Sabitek ${planName}</strong>! Your payment has been processed successfully.</p>
          
          <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #1a1a1a;">Receipt Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666;">Plan</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 600;">${planName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Amount</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 600;">${currency === 'NGN' ? '₦' : currency}${amount.toLocaleString()}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Transaction Ref</td>
                <td style="padding: 8px 0; text-align: right; font-family: monospace; font-size: 12px;">${transactionRef}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Next Billing Date</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 600;">${billingPeriodEnd.toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
              </tr>
            </table>
          </div>
          
          <p>You now have access to:</p>
          <ul style="color: #666;">
            <li>✅ SabiQuiz AI-powered quizzes</li>
            <li>✅ SabiAdvisor career guidance</li>
            <li>✅ Priority support</li>
            <li>✅ All premium features</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://sabitek.school/dashboard" style="background: #ef4444; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">Go to Dashboard</a>
          </div>
          
          <p style="color: #666; font-size: 14px;">If you have any questions, please contact us at support@sabitek.school</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            © ${new Date().getFullYear()} Sabitek. Empowering African education through technology.
          </p>
        </body>
        </html>
      `,
    })

    if (error) {
      console.error('Failed to send subscription receipt email:', error)
      return { success: false, error }
    }

    console.log('Subscription receipt email sent:', data?.id)
    return { success: true, data }
  } catch (error) {
    console.error('Error sending subscription receipt email:', error)
    return { success: false, error }
  }
}

export async function sendCourseReceiptEmail({
  to,
  userName,
  courseName,
  amount,
  currency,
  transactionRef,
  courseSlug,
}: {
  to: string
  userName: string
  courseName: string
  amount: number
  currency: string
  transactionRef: string
  courseSlug: string
}) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Course Purchase Confirmed: ${courseName} 📚`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1a1a1a; margin-bottom: 5px;">Sabitek<span style="color: #ef4444;">✦</span></h1>
          </div>
          
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
            <h2 style="margin: 0 0 10px 0; font-size: 24px;">Course Unlocked! 🎉</h2>
            <p style="margin: 0; opacity: 0.9;">${courseName}</p>
          </div>
          
          <p>Hi ${userName},</p>
          
          <p>Thank you for purchasing <strong>${courseName}</strong>! You now have lifetime access to this course.</p>
          
          <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #1a1a1a;">Receipt Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666;">Course</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 600;">${courseName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Amount</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 600;">${currency === 'NGN' ? '₦' : currency}${amount.toLocaleString()}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Transaction Ref</td>
                <td style="padding: 8px 0; text-align: right; font-family: monospace; font-size: 12px;">${transactionRef}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Access</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #10b981;">Lifetime</td>
              </tr>
            </table>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://sabitek.school/courses/${courseSlug}" style="background: #ef4444; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">Start Learning</a>
          </div>
          
          <p style="color: #666; font-size: 14px;">If you have any questions, please contact us at support@sabitek.school</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            © ${new Date().getFullYear()} Sabitek. Empowering African education through technology.
          </p>
        </body>
        </html>
      `,
    })

    if (error) {
      console.error('Failed to send course receipt email:', error)
      return { success: false, error }
    }

    console.log('Course receipt email sent:', data?.id)
    return { success: true, data }
  } catch (error) {
    console.error('Error sending course receipt email:', error)
    return { success: false, error }
  }
}

export async function sendPaymentFailedEmail({
  to,
  userName,
  planName,
  amount,
  currency,
}: {
  to: string
  userName: string
  planName: string
  amount: number
  currency: string
}) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Payment Failed - Action Required ⚠️`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1a1a1a; margin-bottom: 5px;">Sabitek<span style="color: #ef4444;">✦</span></h1>
          </div>
          
          <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
            <h2 style="margin: 0 0 10px 0; font-size: 24px; color: #dc2626;">Payment Failed</h2>
            <p style="margin: 0; color: #991b1b;">We couldn't process your payment</p>
          </div>
          
          <p>Hi ${userName},</p>
          
          <p>We were unable to process your payment of <strong>${currency === 'NGN' ? '₦' : currency}${amount.toLocaleString()}</strong> for your <strong>${planName}</strong> subscription.</p>
          
          <p>This could happen due to:</p>
          <ul style="color: #666;">
            <li>Insufficient funds</li>
            <li>Expired card</li>
            <li>Bank declined the transaction</li>
          </ul>
          
          <p>To keep your Pro access active, please update your payment method.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://sabitek.school/account/billing" style="background: #ef4444; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">Update Payment Method</a>
          </div>
          
          <p style="color: #666; font-size: 14px;">If you need help, please contact us at support@sabitek.school</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            © ${new Date().getFullYear()} Sabitek. Empowering African education through technology.
          </p>
        </body>
        </html>
      `,
    })

    if (error) {
      console.error('Failed to send payment failed email:', error)
      return { success: false, error }
    }

    console.log('Payment failed email sent:', data?.id)
    return { success: true, data }
  } catch (error) {
    console.error('Error sending payment failed email:', error)
    return { success: false, error }
  }
}

export async function sendWorkspaceWelcomeEmail({
  to,
  userName,
  organisationName,
  loginUrl,
  isNewUser,
  tempPassword,
}: {
  to: string
  userName: string
  organisationName: string
  loginUrl: string
  isNewUser: boolean
  tempPassword?: string
}) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Your Sabitek workspace is ready - ${organisationName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1a1a1a; margin-bottom: 5px;">Sabitek<span style="color: #ef4444;">&#10022;</span></h1>
          </div>

          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
            <h2 style="margin: 0 0 10px 0; font-size: 24px;">Your Workspace is Ready!</h2>
            <p style="margin: 0; opacity: 0.9;">${organisationName}</p>
          </div>

          <p>Hi ${userName},</p>

          <p>Great news! Your application for <strong>${organisationName}</strong> has been approved. Your Sabitek workspace is now active.</p>

          ${isNewUser && tempPassword ? `
          <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #92400e; font-size: 14px;">Your login credentials</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; color: #92400e; font-size: 14px;">Email</td>
                <td style="padding: 6px 0; text-align: right; font-weight: 600; font-size: 14px;">${to}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #92400e; font-size: 14px;">Temporary Password</td>
                <td style="padding: 6px 0; text-align: right; font-weight: 600; font-family: monospace; font-size: 14px;">${tempPassword}</td>
              </tr>
            </table>
            <p style="margin: 10px 0 0 0; color: #92400e; font-size: 12px;">Please change your password after your first login.</p>
          </div>
          ` : `
          <p>Sign in with your existing account to access your new workspace.</p>
          `}

          <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #1a1a1a; font-size: 14px;">What you can do now</h3>
            <ul style="color: #666; margin: 0; padding-left: 20px; font-size: 14px;">
              <li style="margin-bottom: 8px;">Create your first program and add courses</li>
              <li style="margin-bottom: 8px;">Set up cohorts and invite learners</li>
              <li style="margin-bottom: 8px;">Customize your workspace settings</li>
              <li style="margin-bottom: 8px;">Track progress and issue certificates</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" style="background: #ef4444; color: white; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block; font-size: 16px;">Sign In to Your Workspace</a>
          </div>

          <p style="color: #666; font-size: 14px;">If you have any questions, email us at support@sabitek.school</p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

          <p style="color: #999; font-size: 12px; text-align: center;">
            &copy; ${new Date().getFullYear()} Sabitek. Learning infrastructure for Africa.
          </p>
        </body>
        </html>
      `,
    })

    if (error) {
      console.error('Failed to send workspace welcome email:', error)
      return { success: false, error }
    }

    console.log('Workspace welcome email sent:', data?.id)
    return { success: true, data }
  } catch (error) {
    console.error('Error sending workspace welcome email:', error)
    return { success: false, error }
  }
}