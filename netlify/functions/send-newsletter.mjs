// ================================================================
// Send Newsletter API — Resend Delivery Handler
// Endpoint: /.netlify/functions/send-newsletter
// ================================================================

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'RESEND_API_KEY environment variable missing' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const payload = await req.json();
    const { subject, htmlBody, recipients = [], testMode = false } = payload;

    if (!subject || !htmlBody) {
      return new Response(JSON.stringify({ error: 'Subject and htmlBody are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // In test mode, send only to Shardell
    const targetRecipients = testMode
      ? ['rethinkingtheleaf@gmail.com']
      : (recipients.length > 0 ? recipients : ['rethinkingtheleaf@gmail.com']);

    const results = [];
    // Batch send in chunks of 50
    const chunkSize = 50;
    for (let i = 0; i < targetRecipients.length; i += chunkSize) {
      const chunk = targetRecipients.slice(i, i + chunkSize);

      const resendResp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'Re-Thinking The Leaf <newsletter@rethinkingtheleaf.com>',
          to: chunk,
          subject: testMode ? `[TEST PREVIEW] ${subject}` : subject,
          html: htmlBody
        })
      });

      const resendData = await resendResp.json();
      results.push({ chunk: chunk.length, response: resendData });
    }

    return new Response(JSON.stringify({
      success: true,
      testMode,
      recipientCount: targetRecipients.length,
      results,
      sentAt: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('Send newsletter error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export const config = {
  path: '/api/send-newsletter'
};
