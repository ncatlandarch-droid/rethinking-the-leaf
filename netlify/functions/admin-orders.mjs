// ================================================================
// Admin Orders API — Proxies Printful store data for the admin dashboard
// Endpoint: /.netlify/functions/admin-orders
// 
// Note: RTTL uses a Printful QuickStore which has limited API access.
// Orders are accessible but store/products endpoints return the
// default store. We hardcode RTTL product catalog locally.
// ================================================================

// RTTL product catalog (QuickStore products aren't in the API)
const RTTL_PRODUCTS = [
  { id: 1, name: 'Dad Hat (Vintage)', thumbnail: 'Real Product Images/hat1 vintage.webp', variants: 3, synced: true, price: '$18.00' },
  { id: 2, name: 'White Glossy Mug', thumbnail: 'Real Product Images/mug1.webp', variants: 2, synced: true, price: '$8.00' },
  { id: 3, name: 'Circulate the Dollar Tee', thumbnail: 'Real Product Images/shirt2.webp', variants: 5, synced: true, price: '$15.50' },
  { id: 4, name: 'Yoga Leggings (Lavender Wreath)', thumbnail: 'Real Product Images/yoga pants green with lavendar wreath.webp', variants: 4, synced: true, price: '$38.50' },
  { id: 5, name: 'White Glossy Mug (Design II)', thumbnail: 'Real Product Images/mug2.webp', variants: 2, synced: true, price: '$8.00' },
  { id: 6, name: 'Dad Hat (Dark)', thumbnail: 'Real Product Images/hat2.webp', variants: 2, synced: true, price: '$18.00' },
  { id: 7, name: 'Unisex T-Shirt', thumbnail: 'Real Product Images/shirt3.webp', variants: 5, synced: true, price: '$15.50' },
  { id: 8, name: 'Retro Re-Thinking Tee', thumbnail: 'Real Product Images/shirt4.webp', variants: 5, synced: true, price: '$15.50' },
  { id: 9, name: 'Crew Socks', thumbnail: 'Real Product Images/socks.webp', variants: 3, synced: true, price: '$9.50' }
];

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

    // 2. Get recent orders (last 50) — orders work even for QuickStores
    const ordersRes = await fetch('https://api.printful.com/orders?limit=50', { headers });
    const ordersData = await ordersRes.json();

    // 3. Try to get products from API, fall back to local catalog
    let products = RTTL_PRODUCTS;
    try {
      const productsRes = await fetch('https://api.printful.com/store/products?limit=50', { headers });
      const productsData = await productsRes.json();
      const apiProducts = productsData.result || [];
      // Only use API products if they look like RTTL products (check for RTTL-related names)
      const rttlProducts = apiProducts.filter(p => 
        p.name && (
          p.name.toLowerCase().includes('rttl') || 
          p.name.toLowerCase().includes('rethink') ||
          p.name.toLowerCase().includes('leaf') ||
          p.name.toLowerCase().includes('circulate')
        )
      );
      if (rttlProducts.length > 0) {
        products = rttlProducts.map(p => ({
          id: p.id,
          name: p.name,
          thumbnail: p.thumbnail_url,
          variants: p.variants,
          synced: p.synced
        }));
      }
    } catch (e) {
      // Products API failed — use local catalog
      console.log('Products API unavailable, using local catalog');
    }

    // Calculate summary stats
    const orders = ordersData.result || [];
    const statusCounts = {};
    let totalRevenue = 0;
    let totalCost = 0;

    orders.forEach(order => {
      const status = order.status || 'unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
      // Use retail_costs.total if available, otherwise use costs.total as fallback
      const retail = parseFloat(order.retail_costs?.total || order.costs?.total || 0);
      const cost = parseFloat(order.costs?.total || 0);
      totalRevenue += retail;
      totalCost += cost;
    });

    return new Response(JSON.stringify({
      store: storeData.result || [],
      storeName: 'ReThinking the Leaf Farm',
      storeUrl: 'https://rethinkingtheleaf.printful.me/',
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
      products: products,
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
