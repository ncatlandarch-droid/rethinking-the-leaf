// ================================================================
// Admin Analytics API — Proxies Netlify Analytics for the dashboard
// Endpoint: /.netlify/functions/admin-analytics
// ================================================================

const NETLIFY_API = 'https://api.netlify.com/api/v1';

export default async function handler(req) {
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { 'Content-Type': 'application/json' }
    });
  }

  const token = process.env.NETLIFY_AUTH_TOKEN;
  if (!token) {
    return new Response(JSON.stringify({ error: 'NETLIFY_AUTH_TOKEN not configured' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  try {
    // 1. Get site ID
    const sitesRes = await fetch(`${NETLIFY_API}/sites?filter=all&name=rethinkingtheleaf`, { headers });
    const sites = await sitesRes.json();
    const site = sites.find(s => s.custom_domain === 'rethinkingtheleaf.com' || s.name === 'rethinkingtheleaf');

    if (!site) {
      return new Response(JSON.stringify({ error: 'Site not found' }), {
        status: 404, headers: { 'Content-Type': 'application/json' }
      });
    }

    const siteId = site.id;

    // 2. Fetch all analytics endpoints in parallel
    const [pageviewsRes, visitorsRes, pagesRes, sourcesRes, countriesRes, bandwidthRes] = await Promise.all([
      fetch(`${NETLIFY_API}/sites/${siteId}/analytics/pageviews?resolution=day`, { headers }).catch(() => null),
      fetch(`${NETLIFY_API}/sites/${siteId}/analytics/visitors?resolution=day`, { headers }).catch(() => null),
      fetch(`${NETLIFY_API}/sites/${siteId}/analytics/pages/ranking`, { headers }).catch(() => null),
      fetch(`${NETLIFY_API}/sites/${siteId}/analytics/sources/ranking`, { headers }).catch(() => null),
      fetch(`${NETLIFY_API}/sites/${siteId}/analytics/countries/ranking`, { headers }).catch(() => null),
      fetch(`${NETLIFY_API}/sites/${siteId}/analytics/bandwidth?resolution=day`, { headers }).catch(() => null),
    ]);

    const [pageviews, visitors, pages, sources, countries, bandwidth] = await Promise.all([
      pageviewsRes?.ok ? pageviewsRes.json() : null,
      visitorsRes?.ok ? visitorsRes.json() : null,
      pagesRes?.ok ? pagesRes.json() : null,
      sourcesRes?.ok ? sourcesRes.json() : null,
      countriesRes?.ok ? countriesRes.json() : null,
      bandwidthRes?.ok ? bandwidthRes.json() : null,
    ]);

    // 3. Calculate totals from timeseries data
    let totalPageviews = 0;
    let totalVisitors = 0;
    let totalBandwidth = 0;
    const pvTimeseries = [];
    const visitorTimeseries = [];

    if (pageviews?.data) {
      pageviews.data.forEach(d => {
        totalPageviews += d.count || 0;
        pvTimeseries.push({ date: d.date, count: d.count || 0 });
      });
    }
    if (visitors?.data) {
      visitors.data.forEach(d => {
        totalVisitors += d.count || 0;
        visitorTimeseries.push({ date: d.date, count: d.count || 0 });
      });
    }
    if (bandwidth?.data) {
      bandwidth.data.forEach(d => {
        totalBandwidth += d.count || 0;
      });
    }

    return new Response(JSON.stringify({
      summary: {
        total_pageviews: totalPageviews,
        total_visitors: totalVisitors,
        total_bandwidth_gb: (totalBandwidth / (1024 * 1024 * 1024)).toFixed(1),
      },
      pageviews_timeseries: pvTimeseries.slice(-30),
      visitors_timeseries: visitorTimeseries.slice(-30),
      top_pages: (pages?.data || []).slice(0, 10).map(p => ({
        path: p.path || p.resource,
        count: p.count
      })),
      top_sources: (sources?.data || []).slice(0, 10).map(s => ({
        source: s.path || s.resource || 'Direct',
        count: s.count
      })),
      top_countries: (countries?.data || []).slice(0, 10).map(c => ({
        country: c.path || c.resource,
        count: c.count
      })),
      site_info: {
        name: site.name,
        url: site.ssl_url || site.url,
        published_deploy: site.published_deploy?.published_at || null,
        created_at: site.created_at
      },
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
}

export const config = {
  path: '/api/admin-analytics'
};
