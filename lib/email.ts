import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = 'Sabitek <noreply@sabitek.app>'

/**
 * HTML-escape user-supplied text for safe inclusion in email bodies.
 * Used for reviewer-authored fields that pass through to recipients.
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

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
            <a href="https://sabitek.app/dashboard" style="background: #ef4444; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">Go to Dashboard</a>
          </div>
          
          <p style="color: #666; font-size: 14px;">If you have any questions, please contact us at support@sabitek.app</p>
          
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
            <a href="https://sabitek.app/courses/${courseSlug}" style="background: #ef4444; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">Start Learning</a>
          </div>
          
          <p style="color: #666; font-size: 14px;">If you have any questions, please contact us at support@sabitek.app</p>
          
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
            <a href="https://sabitek.app/account/billing" style="background: #ef4444; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">Update Payment Method</a>
          </div>
          
          <p style="color: #666; font-size: 14px;">If you need help, please contact us at support@sabitek.app</p>
          
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

          <p style="color: #666; font-size: 14px;">If you have any questions, email us at support@sabitek.app</p>

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

/**
 * Sends an empathetic notification when an institution application is rejected.
 * Optional `reason` is HTML-escaped and rendered as a "Reviewer note" callout.
 * If reason is empty, the callout is omitted entirely (no placeholder text).
 */
export async function sendApplicationRejectionEmail({
  to,
  userName,
  organisationName,
  reason,
}: {
  to: string
  userName: string
  organisationName: string
  reason?: string | null
}) {
  try {
    const trimmedReason = (reason || '').trim()
    const truncatedReason =
      trimmedReason.length > 2000 ? `${trimmedReason.slice(0, 2000)}...` : trimmedReason
    const hasReason = truncatedReason.length > 0
    const escapedReason = hasReason ? escapeHtml(truncatedReason) : ''
    const safeUserName = escapeHtml(userName)
    const safeOrgName = escapeHtml(organisationName)

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Update on your Sabitek application for ${organisationName}`,
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

          <div style="background: #f9fafb; color: #1f2937; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px; border: 1px solid #e5e7eb;">
            <h2 style="margin: 0 0 10px 0; font-size: 22px; color: #111827;">Application Update</h2>
            <p style="margin: 0; color: #6b7280; font-size: 14px;">${safeOrgName}</p>
          </div>

          <p>Hi ${safeUserName},</p>

          <p>Thank you for your interest in bringing <strong>${safeOrgName}</strong> onto Sabitek and for taking the time to share your application with us.</p>

          <p>After careful review, we are unable to approve your workspace request at this time.</p>

          ${hasReason ? `
          <div style="background: #fffbeb; border-left: 3px solid #f59e0b; border-radius: 8px; padding: 16px 20px; margin: 24px 0;">
            <p style="margin: 0 0 8px 0; color: #92400e; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em;">Reviewer note</p>
            <p style="margin: 0; color: #78350f; font-size: 14px; white-space: pre-line;">${escapedReason}</p>
          </div>
          ` : ''}

          <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <h3 style="margin: 0 0 12px 0; color: #111827; font-size: 14px;">What you can do next</h3>
            <ul style="color: #4b5563; margin: 0; padding-left: 20px; font-size: 14px;">
              <li style="margin-bottom: 8px;">Reach out if you have questions about this decision</li>
              <li style="margin-bottom: 8px;">Reapply later once your circumstances have changed</li>
              <li style="margin-bottom: 8px;">Continue exploring Sabitek as an individual learner</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="mailto:support@sabitek.app" style="background: #ef4444; color: white; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block; font-size: 16px;">Contact Support</a>
          </div>

          <p style="color: #6b7280; font-size: 14px;">We genuinely appreciate the time you put into your application.</p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

          <p style="color: #999; font-size: 12px; text-align: center;">
            &copy; ${new Date().getFullYear()} Sabitek. Learning infrastructure for Africa.
          </p>
        </body>
        </html>
      `,
    })

    if (error) {
      console.error('Failed to send application rejection email:', error)
      return { success: false, error }
    }

    console.log('Application rejection email sent:', data?.id)
    return { success: true, data }
  } catch (error) {
    console.error('Error sending application rejection email:', error)
    return { success: false, error }
  }
}
export async function sendInstitutionInviteEmail({
  to,
  institutionName,
  roleLabel,
  inviteUrl,
  inviterName,
}: {
  to: string
  institutionName: string
  roleLabel: string
  inviteUrl: string
  inviterName?: string
}) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `You've been invited to join ${institutionName} on Sabitek`,
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

          <div style="background: linear-gradient(135deg, #ef4444 0%, #e11d48 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
            <h2 style="margin: 0 0 10px 0; font-size: 24px;">You're invited</h2>
            <p style="margin: 0; opacity: 0.9;">${escapeHtml(institutionName)}</p>
          </div>

          <p>Hello,</p>
          <p>
            ${inviterName ? `${escapeHtml(inviterName)} has` : 'You have been'} invited you to join
            <strong>${escapeHtml(institutionName)}</strong> on Sabitek as
            <strong>${escapeHtml(roleLabel)}</strong>.
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteUrl}"
               style="background: #e11d48; color: white; padding: 14px 32px; border-radius: 999px; text-decoration: none; font-weight: 600; display: inline-block;">
              Accept Invitation
            </a>
          </div>

          <p style="font-size: 14px; color: #666;">
            Or copy this link into your browser:<br>
            <a href="${inviteUrl}" style="color: #e11d48; word-break: break-all;">${inviteUrl}</a>
          </p>

          <p style="font-size: 13px; color: #999; margin-top: 30px;">
            If you weren't expecting this invitation, you can safely ignore this email.
          </p>
        </body>
        </html>
      `,
    })
    if (error) console.error('Institution invite email error:', error)
    return { data, error }
  } catch (err) {
    console.error('Institution invite email failed:', err)
    return { data: null, error: err }
  }
}

/**
 * Sends the evening streak-save nudge to a learner whose active study streak
 * is about to break. Sent only by the daily nudges cron for streaks >= 3 whose
 * last study day was yesterday, so it lands at most once per user per day.
 */
export async function sendStreakReminderEmail({
  to,
  firstName,
  streakDays,
}: {
  to: string
  firstName: string
  streakDays: number
}) {
  try {
    const safeFirstName = escapeHtml(firstName)

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Your ${streakDays}-day streak ends tonight`,
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

          <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
            <h2 style="margin: 0 0 10px 0; font-size: 24px;">${streakDays}-day streak</h2>
            <p style="margin: 0; opacity: 0.9;">Keep it alive before midnight</p>
          </div>

          <p>Hi ${safeFirstName},</p>

          <p>You have studied ${streakDays} days in a row. One lesson tonight keeps it alive.</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://sabitek.app/dashboard" style="background: #ef4444; color: white; padding: 14px 36px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block; font-size: 16px;">Keep my streak</a>
          </div>

          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

          <p style="color: #999; font-size: 12px; text-align: center;">
            You get this only when a streak is about to end. Manage preferences from your profile.
          </p>
        </body>
        </html>
      `,
    })

    if (error) {
      console.error('Failed to send streak reminder email:', error)
      return { success: false, error }
    }

    console.log('Streak reminder email sent:', data?.id)
    return { success: true, data }
  } catch (error) {
    console.error('Error sending streak reminder email:', error)
    return { success: false, error }
  }
}


export async function sendCohortWelcomeEmail({
  to,
  firstName,
  cohortName,
  institutionName,
  programName,
}: {
  to: string
  firstName: string
  cohortName: string
  institutionName: string | null
  programName: string | null
}) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Welcome to ${cohortName}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background: linear-gradient(135deg, #ef4444, #e11d48); border-radius: 12px 12px 0 0; padding: 32px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">You are in, ${escapeHtml(firstName)}!</h1>
          </div>
          <div style="background: #fff; border: 1px solid #fecdd3; border-top: none; border-radius: 0 0 12px 12px; padding: 32px;">
            <p style="color: #374151; font-size: 15px; line-height: 1.7;">
              Welcome to <strong>${escapeHtml(cohortName)}</strong>${institutionName ? ` by <strong>${escapeHtml(institutionName)}</strong>` : ''}.
              ${programName ? `You will be working through the <strong>${escapeHtml(programName)}</strong> program.` : ''}
            </p>
            <p style="color: #374151; font-size: 15px; line-height: 1.7;">
              Your courses are waiting on your dashboard. Small daily steps beat big rare pushes, so start with one lesson today.
            </p>
            <div style="text-align: center; margin: 28px 0 8px;">
              <a href="https://sabitek.app/dashboard" style="background: #ef4444; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">Start learning</a>
            </div>
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 24px;">
              If you have any questions, please contact us at support@sabitek.app
            </p>
          </div>
        </div>
      `,
    })
    if (error) return { success: false as const, error }
    return { success: true as const, data }
  } catch (error) {
    return { success: false as const, error }
  }
}


export async function sendCohortReminderEmail({
  to,
  firstName,
  cohortName,
}: {
  to: string
  firstName: string
  cohortName: string
}) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Your cohort is moving. Jump back in, ${escapeHtml(firstName)}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background: #fff; border: 1px solid #fecdd3; border-radius: 12px; padding: 32px;">
            <h2 style="color: #111827; margin: 0 0 12px; font-size: 20px;">We saved your seat, ${escapeHtml(firstName)}</h2>
            <p style="color: #374151; font-size: 15px; line-height: 1.7;">
              Your cohort <strong>${escapeHtml(cohortName)}</strong> has kept learning while you were away.
              One lesson today puts you right back in the flow.
            </p>
            <div style="text-align: center; margin: 24px 0 8px;">
              <a href="https://sabitek.app/dashboard" style="background: #ef4444; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">Pick up where I left off</a>
            </div>
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 20px;">
              Your organization enabled these occasional reminders for this cohort.
            </p>
          </div>
        </div>
      `,
    })
    if (error) return { success: false as const, error }
    return { success: true as const, data }
  } catch (error) {
    return { success: false as const, error }
  }
}

export async function sendProgramCompletionEmail({
  to,
  firstName,
  programName,
  institutionName,
}: {
  to: string
  firstName: string
  programName: string
  institutionName: string | null
}) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `You completed ${programName}!`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background: linear-gradient(135deg, #ef4444, #e11d48); border-radius: 12px 12px 0 0; padding: 32px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Congratulations, ${escapeHtml(firstName)}!</h1>
          </div>
          <div style="background: #fff; border: 1px solid #fecdd3; border-top: none; border-radius: 0 0 12px 12px; padding: 32px;">
            <p style="color: #374151; font-size: 15px; line-height: 1.7;">
              You have completed every required course in <strong>${escapeHtml(programName)}</strong>${institutionName ? `, offered by <strong>${escapeHtml(institutionName)}</strong>` : ''}.
              That took real consistency, and it shows.
            </p>
            <p style="color: #374151; font-size: 15px; line-height: 1.7;">
              Your course certificates are on your dashboard. Share them, they are verifiable.
            </p>
            <div style="text-align: center; margin: 24px 0 8px;">
              <a href="https://sabitek.app/certificates" style="background: #ef4444; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">View my certificates</a>
            </div>
          </div>
        </div>
      `,
    })
    if (error) return { success: false as const, error }
    return { success: true as const, data }
  } catch (error) {
    return { success: false as const, error }
  }
}


export async function sendCourseAnnouncementEmail({
  to,
  firstName,
  courseTitle,
  instructorName,
  message,
  replyTo,
}: {
  to: string
  firstName: string
  courseTitle: string
  instructorName: string
  message: string
  replyTo?: string
}) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      ...(replyTo ? { replyTo } : {}),
      subject: `Update from your instructor: ${courseTitle}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background: #fff; border: 1px solid #fecdd3; border-radius: 12px; padding: 32px;">
            <p style="color: #9ca3af; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 8px;">Course announcement</p>
            <h2 style="color: #111827; margin: 0 0 4px; font-size: 20px;">${escapeHtml(courseTitle)}</h2>
            <p style="color: #6b7280; font-size: 13px; margin: 0 0 20px;">from ${escapeHtml(instructorName)}</p>
            <p style="color: #374151; font-size: 15px; line-height: 1.7; white-space: pre-line;">Hi ${escapeHtml(firstName)},\n\n${escapeHtml(message)}</p>
            <div style="text-align: center; margin: 24px 0 8px;">
              <a href="https://sabitek.app/dashboard" style="background: #ef4444; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">Open the course</a>
            </div>
          </div>
        </div>
      `,
    })
    if (error) return { success: false as const, error }
    return { success: true as const, data }
  } catch (error) {
    return { success: false as const, error }
  }
}
