// Plaid Accounts — Fetch balances & transactions
// GET /api/plaid-accounts?action=balances
// GET /api/plaid-accounts?action=transactions

import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

const config = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
});

const plaidClient = new PlaidApi(config);

async function getAccessToken() {
  const { getStore } = await import("@netlify/blobs");
  const store = getStore("plaid-tokens");
  const data = await store.get("rttl");
  if (!data) return null;
  const parsed = JSON.parse(data);
  return parsed.access_token;
}

export default async (req, context) => {
  if (req.method === 'OPTIONS') {
    return new Response('', { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET', 'Access-Control-Allow-Headers': 'Content-Type' } });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get('action');
  const accessToken = await getAccessToken();

  if (!accessToken) {
    return Response.json({ error: 'No bank connected. Use Connect Bank first.', connected: false }, { status: 400 });
  }

  try {
    if (action === 'balances') {
      const response = await plaidClient.accountsBalanceGet({
        access_token: accessToken,
      });

      const accounts = response.data.accounts.map(a => ({
        id: a.account_id,
        name: a.name,
        officialName: a.official_name,
        type: a.type,
        subtype: a.subtype,
        mask: a.mask,
        balances: {
          available: a.balances.available,
          current: a.balances.current,
          limit: a.balances.limit,
          currency: a.balances.iso_currency_code || 'USD'
        }
      }));

      const institution = response.data.item;

      return Response.json({
        accounts,
        institution_id: institution?.institution_id,
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'transactions') {
      // Get last 30 days of transactions
      const now = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);

      const startDate = thirtyDaysAgo.toISOString().split('T')[0];
      const endDate = now.toISOString().split('T')[0];

      const response = await plaidClient.transactionsGet({
        access_token: accessToken,
        start_date: startDate,
        end_date: endDate,
        options: { count: 100, offset: 0 }
      });

      const transactions = response.data.transactions.map(t => ({
        id: t.transaction_id,
        date: t.date,
        name: t.name || t.merchant_name,
        merchant: t.merchant_name,
        amount: t.amount,
        category: t.personal_finance_category?.primary || (t.category ? t.category[0] : 'Other'),
        pending: t.pending,
        type: t.amount > 0 ? 'expense' : 'income'
      }));

      // Calculate summary
      const totalIncome = transactions
        .filter(t => t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const totalExpenses = transactions
        .filter(t => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0);

      return Response.json({
        transactions,
        total: response.data.total_transactions,
        summary: {
          income: totalIncome,
          expenses: totalExpenses,
          net: totalIncome - totalExpenses,
          period: `${startDate} to ${endDate}`
        },
        timestamp: new Date().toISOString()
      });
    }

    return Response.json({ error: 'Unknown action. Use: balances, transactions' }, { status: 400 });

  } catch (err) {
    console.error('Plaid accounts error:', err.response?.data || err.message);
    return Response.json({
      error: err.response?.data?.error_message || err.message
    }, { status: 500 });
  }
};

export const config = { path: "/api/plaid-accounts" };
