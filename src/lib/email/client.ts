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

export async function sendNewAgentNotification(agentEmail: string, agentName: string) {
  const fromEmail = process.env.EMAIL_FROM || "onboarding@resend.dev";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const now = new Date().toLocaleString("en-US", { timeZone: "America/New_York", dateStyle: "full", timeStyle: "short" });

  await getResend().emails.send({
    from: `From Your Agent <${fromEmail}>`,
    to: ["angelo@from-your-agent.com", "contact@from-your-agent.com"],
    subject: `New agent signup: ${agentName || agentEmail}`,
    html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:40px 20px;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);margin:0 auto;">
    <tr>
      <td style="background:#E8733A;padding:24px 32px;">
        <p style="margin:0;font-size:18px;font-weight:700;color:#fff;">New Agent Signup 🎉</p>
      </td>
    </tr>
    <tr>
      <td style="padding:32px;">
        <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.6;">
          A new agent just created an account on <strong>From Your Agent</strong>.
        </p>
        <table cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:8px;padding:20px;width:100%;margin-bottom:24px;">
          <tr><td style="font-size:13px;color:#64748b;padding-bottom:6px;">Name</td><td style="font-size:15px;font-weight:600;color:#1e293b;">${agentName || "—"}</td></tr>
          <tr><td style="font-size:13px;color:#64748b;padding-bottom:6px;padding-top:10px;">Email</td><td style="font-size:15px;color:#1e293b;">${agentEmail}</td></tr>
          <tr><td style="font-size:13px;color:#64748b;padding-top:10px;">Signed up</td><td style="font-size:15px;color:#1e293b;">${now} ET</td></tr>
        </table>
        <a href="${appUrl}/admin" style="display:inline-block;background:#E8733A;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;">
          View in Admin Dashboard →
        </a>
      </td>
    </tr>
  </table>
</body>
</html>`,
  });
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

export async function sendBillingReminderFinalEmail(to: string, firstName: string) {
  const fromEmail = process.env.EMAIL_FROM || "onboarding@resend.dev";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  await getResend().emails.send({
    from: `From Your Agent <${fromEmail}>`,
    replyTo: "support@from-your-agent.com",
    to,
    subject: "Last chance: postcards go out tomorrow — add your payment method now",
    html: billingReminderFinalTemplate(firstName, appUrl),
  });
}

function billingReminderFinalTemplate(firstName: string, appUrl: string): string {
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
          <tr>
            <td style="background-color:#FFF5EE;padding:32px 40px;text-align:center;">
              <img src="${appUrl}/logo-email.png" alt="From Your Agent" width="120" height="120" style="width:120px;height:120px;" />
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <h1 style="margin:0 0 16px;font-size:24px;color:#1e293b;font-family:Georgia,'Times New Roman',serif;">
                Last chance, ${firstName} — postcards go out tomorrow!
              </h1>
              <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#475569;">
                Your next batch of postcards with an amazing exclusive offer to your contacts is queued and ready to mail tomorrow.
                We still don't see a payment method on your account.
              </p>
              <p style="margin:0 0 28px;font-size:16px;line-height:1.6;color:#475569;">
                Add one now to make sure your contacts receive their postcards this month. It only takes a minute.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="background:#fef2f2;border-left:4px solid #ef4444;padding:16px 20px;border-radius:0 8px 8px 0;">
                    <p style="margin:0;font-size:14px;color:#991b1b;font-weight:600;">🚨 Postcards mail tomorrow, the 21st</p>
                    <p style="margin:4px 0 0;font-size:14px;color:#7f1d1d;">Without a payment method, your contacts will be skipped this month.</p>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${appUrl}/dashboard/billing" style="display:inline-block;background-color:#E8733A;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:600;">
                      Add Payment Method Now →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
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

export async function sendBillingReminderEmail(to: string, firstName: string) {
  const fromEmail = process.env.EMAIL_FROM || "onboarding@resend.dev";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  await getResend().emails.send({
    from: `From Your Agent <${fromEmail}>`,
    replyTo: "support@from-your-agent.com",
    to,
    subject: "Action required: Add a payment method before your postcards go out",
    html: billingReminderTemplate(firstName, appUrl),
  });
}

function billingReminderTemplate(firstName: string, appUrl: string): string {
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
          <tr>
            <td style="background-color:#FFF5EE;padding:32px 40px;text-align:center;">
              <img src="${appUrl}/logo-email.png" alt="From Your Agent" width="120" height="120" style="width:120px;height:120px;" />
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <h1 style="margin:0 0 16px;font-size:24px;color:#1e293b;font-family:Georgia,'Times New Roman',serif;">
                Your postcards go out in 5 days, ${firstName}!
              </h1>
              <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#475569;">
                We're ready to send your next batch of postcards with an amazing exclusive offer to your contacts on the 21st.
                To make sure they go out without a hitch, you'll need a payment method on file.
              </p>
              <p style="margin:0 0 28px;font-size:16px;line-height:1.6;color:#475569;">
                You're only charged for postcards that are actually mailed — no monthly fees, no minimums.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="background:#fff8f5;border-left:4px solid #E8733A;padding:16px 20px;border-radius:0 8px 8px 0;">
                    <p style="margin:0;font-size:14px;color:#92400e;font-weight:600;">⏰ Deadline: the 21st of this month</p>
                    <p style="margin:4px 0 0;font-size:14px;color:#78350f;">Postcards without a payment method on file will be skipped for this month.</p>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${appUrl}/dashboard/billing" style="display:inline-block;background-color:#E8733A;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:600;">
                      Add Payment Method →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
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
                Questions? Reach us at <a href="mailto:support@from-your-agent.com" style="color:#94a3b8;">support@from-your-agent.com</a> &middot; &copy; ${new Date().getFullYear()} From Your Agent
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
