// ================================================================
// Submit Notification API — Instant notification logger & email dispatcher
// Endpoint: /.netlify/functions/submit-notification
// ================================================================

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const payload = await req.json();
    const { formType, data, page, submittedAt } = payload;

    const recipient = 'rethinkingtheleaf@gmail.com';
    const formLabels = {
      'contact': '📩 New Website Contact Message',
      'newsletter': '🌾 New Newsletter Subscription',
      'event-booking': '🎪 New Event Booking Request',
      'partner-application': '🤝 New Partner Application',
      'membership': '🏷️ New Member Signup'
    };

    const subject = formLabels[formType] || `📩 New ${formType} Submission — ReThinking The Leaf`;

    console.log(`[Form Notification] ${subject} from ${data.name || data.email || 'Visitor'} on page ${page}`);
    console.log('Submission details:', JSON.stringify(data, null, 2));

    // Dispatch email notification via Resend API
    const mailApiKey = process.env.RESEND_API_KEY;
    if (mailApiKey) {
      const detailsHtml = Object.entries(data)
        .map(([k, v]) => `<tr><td style="padding:6px 12px;font-weight:bold;color:#4b5563;text-transform:capitalize;">${k}</td><td style="padding:6px 12px;color:#111827;">${v}</td></tr>`)
        .join('');

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; background: #ffffff;">
          <div style="background: #1b3022; color: #d4af37; padding: 16px 24px; text-align: center;">
            <h2 style="margin: 0; font-size: 20px;">Re-Thinking The Leaf</h2>
            <p style="margin: 4px 0 0; font-size: 13px; color: #a78bfa;">${subject}</p>
          </div>
          <div style="padding: 24px;">
            <p style="color: #374151; font-size: 15px; margin-top: 0;">Hi Shardell,</p>
            <p style="color: #374151; font-size: 14px;">You received a new submission from <strong>rethinkingtheleaf.com</strong>:</p>
            <table style="width: 100%; border-collapse: collapse; margin: 16px 0; background: #f9fafb; border-radius: 6px; border: 1px solid #f3f4f6;">
              <tbody>${detailsHtml}</tbody>
            </table>
            <p style="color: #6b7280; font-size: 12px; margin-bottom: 0;">Submitted on: ${submittedAt || new Date().toISOString()}</p>
          </div>
          <div style="background: #f3f4f6; padding: 12px 24px; text-align: center; color: #9ca3af; font-size: 11px;">
            Re-Thinking The Leaf Farm Admin • Lawrenceville, VA
          </div>
        </div>
      `;

      try {
        const resendResp = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${mailApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'ReThinking The Leaf <newsletter@rethinkingtheleaf.com>',
            to: [recipient],
            subject: subject,
            html: emailHtml
          })
        });
        const resendData = await resendResp.json();
        console.log('[Resend Dispatch Success]:', resendData);
      } catch (sendErr) {
        console.error('[Resend Dispatch Error]:', sendErr);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      formType,
      recipient,
      message: 'Notification logged successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('Notification handler error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export const config = {
  path: '/api/submit-notification'
};
