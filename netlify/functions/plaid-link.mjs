// Plaid Link — Create link tokens & exchange public tokens
// POST /api/plaid-link?action=create_link_token
// POST /api/plaid-link?action=exchange_token  (body: { public_token })
// POST /api/plaid-link?action=disconnect

import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from 'plaid';

const plaidConfig = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
});

const plaidClient = new PlaidApi(plaidConfig);

// Simple in-memory store for demo; in production use Firestore
let accessToken = null;
let itemId = null;

export default async (req, context) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response('', { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, GET', 'Access-Control-Allow-Headers': 'Content-Type' } });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get('action');

  try {
    if (action === 'create_link_token') {
      const response = await plaidClient.linkTokenCreate({
        user: { client_user_id: 'rttl-admin' },
        client_name: 'RTTL Admin Dashboard',
        products: [Products.Transactions],
        country_codes: [CountryCode.Us],
        language: 'en',
      });
      return Response.json({ link_token: response.data.link_token });
    }

    if (action === 'exchange_token') {
      const body = await req.json();
      const response = await plaidClient.itemPublicTokenExchange({
        public_token: body.public_token,
      });
      accessToken = response.data.access_token;
      itemId = response.data.item_id;

      // Store in Netlify Blob for persistence
      const { getStore } = await import("@netlify/blobs");
      const store = getStore("plaid-tokens");
      await store.set("rttl", JSON.stringify({
        access_token: accessToken,
        item_id: itemId,
        connected_at: new Date().toISOString()
      }));

      return Response.json({ success: true, item_id: itemId });
    }

    if (action === 'disconnect') {
      const { getStore } = await import("@netlify/blobs");
      const store = getStore("plaid-tokens");
      await store.delete("rttl");
      accessToken = null;
      itemId = null;
      return Response.json({ success: true, disconnected: true });
    }

    if (action === 'status') {
      const { getStore } = await import("@netlify/blobs");
      const store = getStore("plaid-tokens");
      const data = await store.get("rttl");
      return Response.json({ connected: !!data });
    }

    return Response.json({ error: 'Unknown action. Use: create_link_token, exchange_token, disconnect, status' }, { status: 400 });

  } catch (err) {
    console.error('Plaid error:', err.response?.data || err.message);
    return Response.json({
      error: err.response?.data?.error_message || err.message
    }, { status: 500 });
  }
};

export const config = { path: "/api/plaid-link" };
