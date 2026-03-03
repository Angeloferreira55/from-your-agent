import { Resend } from "resend";

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not set");
    }
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

export async function sendWelcomeEmail(to: string, firstName: string) {
  const fromEmail = process.env.EMAIL_FROM || "onboarding@resend.dev";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const { error } = await getResend().emails.send({
    from: `From Your Agent <${fromEmail}>`,
    replyTo: "support@from-your-agent.com",
    to,
    subject: `Welcome to From Your Agent, ${firstName}!`,
    html: welcomeTemplate(firstName, appUrl),
  });

  if (error) {
    console.error("[Email] Failed to send welcome email:", error);
    throw error;
  }
}

function welcomeTemplate(firstName: string, appUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background-color:#FFF5EE;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FFF5EE;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
          <!-- Header -->
          <tr>
            <td style="background-color:#FFF5EE;padding:32px 40px;text-align:center;">
              <img src="${appUrl}/logo-email.png" alt="From Your Agent" width="120" height="120" style="width:120px;height:120px;" />
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h1 style="margin:0 0 16px;font-size:24px;color:#1e293b;font-family:Georgia,'Times New Roman',serif;">
                Welcome aboard, ${firstName}!
              </h1>
              <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#475569;">
                You're all set to start building lasting relationships with your clients through monthly postcards featuring local deals they'll love.
              </p>

              <h2 style="margin:0 0 12px;font-size:18px;color:#1e293b;font-family:Georgia,'Times New Roman',serif;">
                Here's how to get started:
              </h2>

              <!-- Step 1 -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
                <tr>
                  <td width="36" valign="top">
                    <div style="width:28px;height:28px;border-radius:50%;background-color:#E8733A;color:#fff;text-align:center;line-height:28px;font-size:14px;font-weight:bold;">1</div>
                  </td>
                  <td style="padding-left:12px;">
                    <p style="margin:0;font-size:15px;color:#334155;line-height:1.5;">
                      <strong>Complete your profile</strong> — Add your headshot, logo, and a personal message that will appear on every postcard.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Step 2 -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
                <tr>
                  <td width="36" valign="top">
                    <div style="width:28px;height:28px;border-radius:50%;background-color:#E8733A;color:#fff;text-align:center;line-height:28px;font-size:14px;font-weight:bold;">2</div>
                  </td>
                  <td style="padding-left:12px;">
                    <p style="margin:0;font-size:15px;color:#334155;line-height:1.5;">
                      <strong>Upload your contacts</strong> — Import your client list via CSV. We'll verify every address automatically.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Step 3 -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
                <tr>
                  <td width="36" valign="top">
                    <div style="width:28px;height:28px;border-radius:50%;background-color:#E8733A;color:#fff;text-align:center;line-height:28px;font-size:14px;font-weight:bold;">3</div>
                  </td>
                  <td style="padding-left:12px;">
                    <p style="margin:0;font-size:15px;color:#334155;line-height:1.5;">
                      <strong>Add a payment method</strong> — Pay only for postcards you send. No monthly fees or minimums.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Step 4 -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td width="36" valign="top">
                    <div style="width:28px;height:28px;border-radius:50%;background-color:#E8733A;color:#fff;text-align:center;line-height:28px;font-size:14px;font-weight:bold;">4</div>
                  </td>
                  <td style="padding-left:12px;">
                    <p style="margin:0;font-size:15px;color:#334155;line-height:1.5;">
                      <strong>Preview your first postcard</strong> — See exactly what your clients will receive before anything goes out.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${appUrl}/dashboard/settings" style="display:inline-block;background-color:#E8733A;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:600;">
                      Complete Your Profile
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;background-color:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0;font-size:13px;color:#94a3b8;">
                Questions? Reply to this email or reach us at <a href="mailto:support@from-your-agent.com" style="color:#94a3b8;">support@from-your-agent.com</a> &middot; &copy; ${new Date().getFullYear()} From Your Agent
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
