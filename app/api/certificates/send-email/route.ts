import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const { email, pdfData, certificateData } = await req.json()

    if (!email || !pdfData || !certificateData) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const { userName, courseName, certificateNumber, grade, issuedAt } = certificateData

    // Format date
    const issueDate = new Date(issuedAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    // Convert base64 to buffer for attachment
    const pdfBuffer = Buffer.from(pdfData, 'base64')

    // Send email with PDF attachment
    const { data, error } = await resend.emails.send({
      from: 'Sabitek <certificates@sabitek.app>',
      to: email,
      subject: `🎓 Your Certificate: ${courseName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9fafb;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="display: inline-block; background: linear-gradient(135deg, #ef4444, #ec4899); padding: 12px 20px; border-radius: 12px;">
                <span style="color: white; font-size: 24px; font-weight: bold;">🎓 Sabitek</span>
              </div>
            </div>
            
            <!-- Main Card -->
            <div style="background: white; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
              <!-- Congratulations -->
              <div style="text-align: center; margin-bottom: 24px;">
                <div style="font-size: 48px; margin-bottom: 8px;">🎉</div>
                <h1 style="margin: 0; color: #111827; font-size: 24px; font-weight: 700;">
                  Congratulations, ${userName}!
                </h1>
                <p style="margin: 8px 0 0; color: #6b7280; font-size: 14px;">
                  You have successfully completed a course on Sabitek
                </p>
              </div>
              
              <!-- Course Details -->
              <div style="background: linear-gradient(135deg, #fef2f2, #fdf2f8); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <h2 style="margin: 0 0 16px; color: #111827; font-size: 18px; font-weight: 600;">
                  ${courseName}
                </h2>
                <div style="display: flex; gap: 24px;">
                  <div>
                    <p style="margin: 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Grade Achieved</p>
                    <p style="margin: 4px 0 0; color: #dc2626; font-size: 24px; font-weight: 700;">${grade}%</p>
                  </div>
                  <div>
                    <p style="margin: 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Issued Date</p>
                    <p style="margin: 4px 0 0; color: #111827; font-size: 16px; font-weight: 600;">${issueDate}</p>
                  </div>
                </div>
              </div>
              
              <!-- Certificate Info -->
              <div style="text-align: center; margin-bottom: 24px;">
                <p style="margin: 0; color: #6b7280; font-size: 13px;">
                  Certificate Number: <strong style="color: #111827; font-family: monospace;">${certificateNumber}</strong>
                </p>
              </div>
              
              <!-- Attachment Note -->
              <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px;">
                <p style="margin: 0; color: #065f46; font-size: 13px;">
                  📎 Your certificate PDF is attached to this email. Download and save it for your records.
                </p>
              </div>
              
              <!-- Verify Link -->
              <div style="text-align: center;">
                <p style="margin: 0 0 12px; color: #6b7280; font-size: 13px;">
                  Anyone can verify your certificate at:
                </p>
                <a href="https://sabitek.app/verify/${certificateNumber}" 
                   style="display: inline-block; background: linear-gradient(135deg, #ef4444, #ec4899); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
                  Verify Certificate
                </a>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; margin-top: 30px;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                © ${new Date().getFullYear()} Sabitek by Tek4All Digital Inclusion Initiative
              </p>
              <p style="margin: 8px 0 0; color: #9ca3af; font-size: 12px;">
                Empowering African learners through accessible education
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      attachments: [
        {
          filename: `${certificateNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      messageId: data?.id 
    })

  } catch (error: any) {
    console.error('Email API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}