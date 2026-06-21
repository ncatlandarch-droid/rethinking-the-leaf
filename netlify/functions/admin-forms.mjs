// ================================================================
// Admin Forms API — Proxies Netlify Forms data for the admin dashboard
// Endpoint: /.netlify/functions/admin-forms
// ================================================================

export default async function handler(req) {
  // Only allow GET
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const authToken = process.env.NETLIFY_AUTH_TOKEN;
  const siteId = '824f1c77-340e-4037-9987-606beef19dd8';

  if (!authToken) {
    return new Response(JSON.stringify({ error: 'NETLIFY_AUTH_TOKEN not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // 1. Get all forms for the site
    const formsRes = await fetch(
      `https://api.netlify.com/api/v1/sites/${siteId}/forms`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    const forms = await formsRes.json();

    // 2. Get submissions for each form (last 100 per form)
    const result = {};
    for (const form of forms) {
      const subsRes = await fetch(
        `https://api.netlify.com/api/v1/forms/${form.id}/submissions?per_page=100`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      const submissions = await subsRes.json();
      result[form.name] = {
        id: form.id,
        count: form.submission_count,
        submissions: submissions.map(s => ({
          id: s.id,
          created_at: s.created_at,
          data: s.data
        }))
      };
    }

    // 3. Get recent deploys for site status
    const deploysRes = await fetch(
      `https://api.netlify.com/api/v1/sites/${siteId}/deploys?per_page=5`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    const deploys = await deploysRes.json();

    return new Response(JSON.stringify({
      forms: result,
      deploys: deploys.map(d => ({
        id: d.id,
        created_at: d.created_at,
        state: d.state,
        title: d.title,
        deploy_time: d.deploy_time,
        branch: d.branch
      })),
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
  path: '/api/admin-forms'
};
