// ================================================================
// Admin Orders API — Proxies Printful store data for the admin dashboard
// Endpoint: /.netlify/functions/admin-orders
// ================================================================

export default async function handler(req) {
  // Only allow GET
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const apiToken = process.env.PRINTFUL_API_TOKEN;

  if (!apiToken) {
    return new Response(JSON.stringify({ error: 'PRINTFUL_API_TOKEN not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const headers = {
    'Authorization': `Bearer ${apiToken}`,
    'Content-Type': 'application/json'
  };

  try {
    // 1. Get store info
    const storeRes = await fetch('https://api.printful.com/stores', { headers });
    const storeData = await storeRes.json();

    // 2. Get recent orders (last 50)
    const ordersRes = await fetch('https://api.printful.com/orders?limit=50', { headers });
    const ordersData = await ordersRes.json();

    // 3. Get products in store
    const productsRes = await fetch('https://api.printful.com/store/products?limit=50', { headers });
    const productsData = await productsRes.json();

    // Calculate summary stats
    const orders = ordersData.result || [];
    const statusCounts = {};
    let totalRevenue = 0;

    orders.forEach(order => {
      const status = order.status || 'unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
      if (order.retail_costs) {
        totalRevenue += parseFloat(order.retail_costs.total || 0);
      }
    });

    return new Response(JSON.stringify({
      store: storeData.result || [],
      orders: orders.map(o => ({
        id: o.id,
        external_id: o.external_id,
        status: o.status,
        created: o.created,
        updated: o.updated,
        recipient: o.recipient ? {
          name: o.recipient.name,
          city: o.recipient.city,
          state_code: o.recipient.state_code
        } : null,
        items: (o.items || []).map(item => ({
          name: item.name,
          quantity: item.quantity,
          retail_price: item.retail_price,
          thumbnail: item.thumbnail_url
        })),
        retail_costs: o.retail_costs,
        costs: o.costs
      })),
      products: (productsData.result || []).map(p => ({
        id: p.id,
        name: p.name,
        thumbnail: p.thumbnail_url,
        variants: p.variants,
        synced: p.synced
      })),
      summary: {
        total_orders: orders.length,
        status_counts: statusCounts,
        total_revenue: totalRevenue.toFixed(2)
      },
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export const config = {
  path: '/api/admin-orders'
};
