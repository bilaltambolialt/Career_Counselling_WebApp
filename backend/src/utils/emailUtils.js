import nodemailer from 'nodemailer';

// Uses SMTP_* env vars (matches backend/.env)
// Hostinger requires port 587 + STARTTLS (secure: false) or port 465 + SSL (secure: true)
function createTransporter() {
  const port   = parseInt(process.env.SMTP_PORT || '587');
  const secure = port === 465;
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false,   // accept Hostinger's self-signed cert in dev
    },
  });
}

// Call this at startup to catch bad SMTP config early
export async function verifySmtp() {
  try {
    const t = createTransporter();
    await t.verify();
    console.log('✓ SMTP connection verified:', process.env.SMTP_HOST);
  } catch (err) {
    console.error('✗ SMTP connection FAILED:', err.message);
    console.error('  Check SMTP_HOST / SMTP_USER / SMTP_PASS in .env');
  }
}

const ROLE_LABELS = {
  student:     'Student Portal',
  counselor:   'Counselor Portal',
  admin:       'Admin Portal',
  super_admin: 'Super Admin Portal',
};

export const sendPasswordResetEmail = async ({ to, resetUrl, role }) => {
  const portalName = ROLE_LABELS[role] || 'Portal';
  const transporter = createTransporter();

  await transporter.sendMail({
    from:    `"ICGC — Indian Career Guidance Council" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
    to,
    subject: 'Reset your ICGC password',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:#193553;padding:28px 40px;text-align:center;">
              <h1 style="color:#f99902;font-size:22px;font-weight:800;margin:0;letter-spacing:-0.02em;">ICGC</h1>
              <p style="color:rgba(255,255,255,0.65);font-size:12px;margin:4px 0 0;letter-spacing:0.08em;">INDIAN CAREER GUIDANCE COUNCIL</p>
              <p style="color:rgba(255,255,255,0.45);font-size:11px;margin:6px 0 0;">${portalName}</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <h2 style="color:#193553;font-size:20px;font-weight:700;margin:0 0 12px;">Password Reset Request</h2>
              <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 24px;">
                We received a request to reset the password for your <strong>${portalName}</strong> account.
                Click the button below to set a new password. This link is valid for <strong>1 hour</strong>.
              </p>

              <div style="text-align:center;margin:28px 0;">
                <a href="${resetUrl}"
                  style="display:inline-block;background:#f99902;color:#ffffff;font-size:15px;
                    font-weight:700;text-decoration:none;padding:14px 36px;border-radius:10px;">
                  Reset My Password
                </a>
              </div>

              <p style="color:#64748b;font-size:13px;line-height:1.6;margin:0 0 8px;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="word-break:break-all;font-size:12px;color:#193553;margin:0 0 24px;">
                ${resetUrl}
              </p>

              <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />
              <p style="color:#94a3b8;font-size:12px;margin:0;">
                If you didn't request a password reset, you can safely ignore this email.
                Your password will not change.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;">
              <p style="color:#94a3b8;font-size:11px;margin:0;">
                Indian Career Guidance Council &mdash; icgc.in
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  });
};
