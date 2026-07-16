import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { email, pdfData, resultData } = await request.json()

    if (!email || !pdfData) {
      return NextResponse.json(
        { error: 'Missing email or PDF data' },
        { status: 400 }
      )
    }

    const pdfBuffer = Buffer.from(pdfData, 'base64')

    const { data, error } = await resend.emails.send({
      from: 'Sabitek Career Advisor <noreply@sabitek.app>',
      to: [email],
      subject: 'Your Personalized Tech Career Path - SabiAdvisor',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #dc2626 0%, #ec4899 100%);
                color: white;
                padding: 30px;
                border-radius: 10px;
                text-align: center;
                margin-bottom: 30px;
              }
              .header h1 {
                margin: 0;
                font-size: 24px;
              }
              .content {
                background: #f9fafb;
                padding: 25px;
                border-radius: 10px;
                margin-bottom: 20px;
              }
              .track {
                background: white;
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 15px;
                border-left: 4px solid #dc2626;
              }
              .track h3 {
                margin: 0 0 8px 0;
                color: #111827;
                font-size: 18px;
              }
              .confidence {
                display: inline-block;
                background: #dcfce7;
                color: #166534;
                padding: 4px 12px;
                border-radius: 6px;
                font-weight: bold;
                font-size: 12px;
              }
              .cta {
                text-align: center;
                margin: 30px 0;
              }
              .button {
                display: inline-block;
                background: linear-gradient(135deg, #dc2626 0%, #ec4899 100%);
                color: white;
                padding: 14px 28px;
                border-radius: 8px;
                text-decoration: none;
                font-weight: bold;
              }
              .footer {
                text-align: center;
                color: #6b7280;
                font-size: 14px;
                margin-top: 30px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>🎯 Your Tech Career Path is Ready!</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Personalized recommendations from SabiAdvisor</p>
            </div>

            <div class="content">
              <p>Hello!</p>
              <p>Congratulations! Based on your assessment, we've identified the perfect tech career paths for you.</p>
              
              <h2 style="color: #111827; margin-top: 25px;">Your Top Recommendations:</h2>
              ${resultData.primaryTracks.map((track: any) => `
                <div class="track">
                  <h3>${track.name}</h3>
                  <span class="confidence">${track.confidence}% Match</span>
                  <p style="margin: 10px 0 0 0; color: #4b5563;">${track.why_fits}</p>
                </div>
              `).join('')}

              <p style="margin-top: 20px;">
                <strong>Overall Confidence:</strong> ${Math.round(resultData.confidence)}%
              </p>
            </div>

            <div class="cta">
              <a href="https://sabitek.app/courses" class="button">
                Browse Courses to Get Started
              </a>
            </div>

            <div class="content">
              <h3 style="color: #111827;">What's Next?</h3>
              <ol style="margin: 15px 0; padding-left: 20px;">
                <li>Review the attached PDF with your complete career roadmap</li>
                <li>Start with free resources mentioned in your plan</li>
                <li>Join Nigerian tech communities for support</li>
                <li>Begin building your portfolio projects</li>
              </ol>
            </div>

            <div class="footer">
              <p><strong>Sabitek</strong> - Empowering African Learners</p>
              <p>Questions? Visit <a href="https://sabitek.app" style="color: #dc2626;">sabitek.app</a></p>
            </div>
          </body>
        </html>
      `,
      attachments: [
        {
          filename: 'sabitek-career-path.pdf',
          content: pdfBuffer,
        },
      ],
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, messageId: data?.id })
  } catch (error: any) {
    console.error('Email API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send email' },
      { status: 500 }
    )
  }
}