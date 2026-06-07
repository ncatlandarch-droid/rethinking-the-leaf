/**
 * Printful Webhook → PayPal Auto-Payout
 * 
 * When a Printful order ships, this function:
 * 1. Receives the webhook event from Printful
 * 2. Calculates profit (retail price - Printful cost)
 * 3. Sends the profit to Shardell via PayPal Payouts API
 * 
 * Env vars required (set on Netlify):
 *   PAYPAL_CLIENT_ID, PAYPAL_SECRET, PAYPAL_RECIPIENT_EMAIL
 */

const PAYPAL_API = 'https://api-m.paypal.com'; // Live
const LOG_PREFIX = '[RTTL-Payout]';

// Get PayPal access token
async function getPayPalToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_SECRET;
  
  const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${clientId}:${secret}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  
  const data = await res.json();
  if (!data.access_token) {
    throw new Error(`PayPal auth failed: ${JSON.stringify(data)}`);
  }
  return data.access_token;
}

// Send payout via PayPal
async function sendPayout(amount, currency, note, orderId) {
  const token = await getPayPalToken();
  const recipientEmail = process.env.PAYPAL_RECIPIENT_EMAIL;
  
  const res = await fetch(`${PAYPAL_API}/v1/payments/payouts`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender_batch_header: {
        sender_batch_id: `RTTL-${orderId}-${Date.now()}`,
        email_subject: 'ReThinking The Leaf — Sale Payout',
        email_message: `You received a payout from a sale on the ReThinking The Leaf store. ${note}`,
      },
      items: [
        {
          recipient_type: 'EMAIL',
          amount: { value: amount.toFixed(2), currency },
          receiver: recipientEmail,
          note: note,
          sender_item_id: `RTTL-ITEM-${orderId}`,
        },
      ],
    }),
  });
  
  const data = await res.json();
  return data;
}

// Main handler
export default async function handler(req) {
  // Only accept POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const body = await req.json();
    const eventType = body.type;
    
    console.log(`${LOG_PREFIX} Received event: ${eventType}`);
    
    // We care about order shipped events
    // Printful webhook types: package_shipped, order_completed
    if (eventType !== 'package_shipped' && eventType !== 'order_completed') {
      console.log(`${LOG_PREFIX} Ignoring event type: ${eventType}`);
      return new Response(JSON.stringify({ status: 'ignored', event: eventType }), { status: 200 });
    }

    const order = body.data?.order || body.data;
    if (!order) {
      console.log(`${LOG_PREFIX} No order data in webhook`);
      return new Response(JSON.stringify({ error: 'No order data' }), { status: 400 });
    }

    const orderId = order.id || order.external_id || 'unknown';
    const retailTotal = parseFloat(order.retail_costs?.total || '0');
    const printfulCost = parseFloat(order.costs?.total || '0');
    const profit = retailTotal - printfulCost;
    const currency = order.retail_costs?.currency || 'USD';

    console.log(`${LOG_PREFIX} Order ${orderId}: Retail $${retailTotal} - Cost $${printfulCost} = Profit $${profit}`);

    // Only payout if there's actual profit
    if (profit <= 0) {
      console.log(`${LOG_PREFIX} No profit on order ${orderId}, skipping payout`);
      return new Response(JSON.stringify({ 
        status: 'skipped', 
        reason: 'no_profit',
        orderId,
        retail: retailTotal,
        cost: printfulCost,
      }), { status: 200 });
    }

    // Send the full profit to Shardell
    const note = `Order #${orderId} — Retail: $${retailTotal.toFixed(2)}, Production: $${printfulCost.toFixed(2)}, Your Profit: $${profit.toFixed(2)}`;
    console.log(`${LOG_PREFIX} Sending $${profit.toFixed(2)} to ${process.env.PAYPAL_RECIPIENT_EMAIL}`);
    
    const payoutResult = await sendPayout(profit, currency, note, orderId);
    
    console.log(`${LOG_PREFIX} Payout result:`, JSON.stringify(payoutResult));

    return new Response(JSON.stringify({
      status: 'payout_sent',
      orderId,
      amount: profit.toFixed(2),
      currency,
      recipient: process.env.PAYPAL_RECIPIENT_EMAIL,
      paypal_batch_id: payoutResult.batch_header?.payout_batch_id || 'pending',
    }), { status: 200 });

  } catch (err) {
    console.error(`${LOG_PREFIX} Error:`, err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

// Netlify function config
export const config = {
  path: '/api/printful-webhook',
};
