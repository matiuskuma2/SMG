import * as sgMail from '@sendgrid/mail';
import type { MailDataRequired } from '@sendgrid/mail';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_SENDER_EMAIL =
  process.env.SENDGRID_SENDER_EMAIL ?? 'no-reply@example.com';

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
} else {
  console.warn('SendGrid API key is not set. Emails will not be sent.');
}

export async function sendEmail({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<void> {
  if (!SENDGRID_API_KEY) return; // キー未設定時はスキップ

  const msg: MailDataRequired = {
    to,
    from: SENDGRID_SENDER_EMAIL,
    subject,
    text,
    html: html ?? `<p>${text}</p>`,
  };

  try {
    await sgMail.send(msg);
  } catch (error) {
    console.error('SendGrid send error:', error);
  }
}
