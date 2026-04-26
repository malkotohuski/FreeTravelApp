const {Resend} = require('resend');

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL = 'noreply@freetravelapp.it.com';
const APP_NAME = 'FreeTravelApp';

function getBaseTemplate({title, intro, body, footer}) {
  return `
    <div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 30px;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 12px; box-shadow: 0 5px 15px rgba(0,0,0,0.08);">
        <h2 style="margin: 0 0 18px; color: #222;">${APP_NAME}</h2>
        <h3 style="margin: 0 0 18px; color: #333;">${title}</h3>
        <p style="font-size: 15px; line-height: 1.6; color: #444;">${intro}</p>
        ${body}
        <p style="font-size: 14px; line-height: 1.6; color: #666; margin-top: 24px;">${footer}</p>
        <hr style="margin: 24px 0; border: 0; border-top: 1px solid #e5e7eb;" />
        <p style="font-size: 12px; color: #999; margin: 0;">
          Copyright ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
        </p>
      </div>
    </div>
  `;
}

async function sendEmail({to, subject, html, text}) {
  if (!resend) {
    console.warn('RESEND_API_KEY is missing. Skipping email send.');
    return;
  }

  const {error} = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject,
    html,
    text,
  });

  if (error) {
    throw new Error(
      typeof error === 'string' ? error : error.message || 'Failed to send email.',
    );
  }
}

async function sendConfirmationEmail(to, code) {
  const html = getBaseTemplate({
    title: 'Confirmation Code',
    intro: 'Thank you for registering. Your confirmation code is:',
    body: `
      <div style="margin: 24px 0; padding: 18px; background: #f8fafc; border-radius: 10px; text-align: center;">
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #111827;">
          ${code}
        </div>
      </div>
    `,
    footer:
      'This code expires in 10 minutes. If you did not create an account, please ignore this email.',
  });

  await sendEmail({
    to,
    subject: `${APP_NAME} - Confirmation Code`,
    html,
    text: `Your confirmation code is: ${code}. This code expires in 10 minutes.`,
  });
}

async function sendResetEmail(to, code) {
  const html = getBaseTemplate({
    title: 'Password Reset Code',
    intro: 'We received a request to reset your password. Your reset code is:',
    body: `
      <div style="margin: 24px 0; padding: 18px; background: #f8fafc; border-radius: 10px; text-align: center;">
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #111827;">
          ${code}
        </div>
      </div>
    `,
    footer:
      'This code expires in 15 minutes. If you did not request a password reset, please ignore this email.',
  });

  await sendEmail({
    to,
    subject: `${APP_NAME} - Password Reset Code`,
    html,
    text: `Your password reset code is: ${code}. This code expires in 15 minutes.`,
  });
}

async function sendReportReceivedEmail(report, reporterEmail) {
  const html = getBaseTemplate({
    title: 'Report Received',
    intro: `Hello ${report.reporter.username},`,
    body: `
      <p style="font-size: 15px; line-height: 1.6; color: #444;">
        Your report has been received and is now under review.
      </p>
      <div style="margin: 20px 0; padding: 16px; background: #f8fafc; border-radius: 10px;">
        <p style="margin: 0 0 8px;"><strong>Report ID:</strong> ${report.id}</p>
        <p style="margin: 0 0 8px;"><strong>Reported User:</strong> ${report.reported.username}</p>
        <p style="margin: 0;"><strong>Status:</strong> <span style="color: #6b7280; font-weight: bold;">${report.status}</span></p>
      </div>
    `,
    footer:
      'We will review the case and get back to you as soon as possible.',
  });

  await sendEmail({
    to: reporterEmail,
    subject: `${APP_NAME} - Report #${report.id} Received`,
    html,
    text: `Your report #${report.id} has been received and is under review.`,
  });
}

async function sendAdminReportEmail(report) {
  const adminEmail = process.env.REPORTS_EMAIL || 'appfreetravel@gmail.com';
  const imageSection = report.image
    ? `<p style="margin: 0;"><strong>Attachment:</strong> <a href="${report.image}" target="_blank" rel="noreferrer">Open image</a></p>`
    : `<p style="margin: 0;"><strong>Attachment:</strong> No image provided</p>`;

  const html = getBaseTemplate({
    title: 'New User Report',
    intro: 'A new report has been submitted in FreeTravelApp.',
    body: `
      <div style="margin: 20px 0; padding: 16px; background: #f8fafc; border-radius: 10px;">
        <p style="margin: 0 0 8px;"><strong>Report ID:</strong> ${report.id}</p>
        <p style="margin: 0 0 8px;"><strong>Reporter:</strong> ${report.reporter.username} (${report.reporter.email})</p>
        <p style="margin: 0 0 8px;"><strong>Reported User:</strong> ${report.reported.username} (${report.reported.email})</p>
        <p style="margin: 0 0 8px;"><strong>Status:</strong> ${report.status}</p>
        ${imageSection}
      </div>
      <div style="margin-top: 20px; padding: 16px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 10px;">
        <p style="margin: 0; white-space: pre-wrap; color: #374151;"><strong>Report text:</strong></p>
        <p style="margin: 10px 0 0; white-space: pre-wrap; color: #374151;">${report.text}</p>
      </div>
    `,
    footer: 'Review the report in the admin flow and update the status when ready.',
  });

  await sendEmail({
    to: adminEmail,
    subject: `${APP_NAME} - New Report #${report.id}`,
    html,
    text: `New report #${report.id} from ${report.reporter.username} against ${report.reported.username}.`,
  });
}

async function sendReportStatusEmail(report, reporterEmail) {
  let message;
  let statusColor;

  if (report.status === 'RESOLVED') {
    message =
      'Your report has been reviewed and appropriate action has been taken.';
    statusColor = '#16a34a';
  } else if (report.status === 'REJECTED') {
    message = 'Your report has been reviewed but no violation was found.';
    statusColor = '#dc2626';
  } else {
    message = `Status updated to: ${report.status}`;
    statusColor = '#6b7280';
  }

  const html = getBaseTemplate({
    title: 'Report Status Update',
    intro: `Hello ${report.reporter.username},`,
    body: `
      <p style="font-size: 15px; line-height: 1.6; color: #444;">${message}</p>
      <div style="margin: 20px 0; padding: 16px; background: #f8fafc; border-radius: 10px;">
        <p style="margin: 0 0 8px;"><strong>Report ID:</strong> ${report.id}</p>
        <p style="margin: 0 0 8px;"><strong>Reported User:</strong> ${report.reported.username}</p>
        <p style="margin: 0;"><strong>Status:</strong> <span style="color: ${statusColor}; font-weight: bold;">${report.status}</span></p>
      </div>
    `,
    footer: 'If you have further concerns, feel free to contact support.',
  });

  await sendEmail({
    to: reporterEmail,
    subject: `${APP_NAME} - Report #${report.id} Status Update`,
    html,
    text: `Report #${report.id} status updated to ${report.status}. ${message}`,
  });
}

module.exports = {
  sendAdminReportEmail,
  sendConfirmationEmail,
  sendReportReceivedEmail,
  sendResetEmail,
  sendReportStatusEmail,
};
