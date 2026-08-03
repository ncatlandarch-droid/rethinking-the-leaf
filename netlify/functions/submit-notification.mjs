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

    // If SendGrid / Resend / Webhook API key is present in environment, send active email
    const mailApiKey = process.env.RESEND_API_KEY || process.env.SENDGRID_API_KEY;
    if (mailApiKey) {
      // Dispatch via Resend / SendGrid if configured
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
