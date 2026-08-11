// ================================================================
// Newsletter Draft Generator — AI Quarterly Content Generator
// Endpoint: /.netlify/functions/newsletter-draft
// ================================================================

export default async function handler(req) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'GEMINI_API_KEY environment variable missing' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let quarter = 'Q3-2026';
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        if (body.quarter) quarter = body.quarter;
      } catch (e) {}
    }

    const seasonalPrompts = {
      'Q1': 'Winter/Spring Prep — Soil health, cover crops, planning season, circular agrotherapy systems, hemp applications, and preparations for Spring planting on 66 acres in Brunswick County, VA.',
      'Q2': 'Spring Planting — Lavender field updates, hemp seedling transplantation, pollinator gardens, VSU Floralpy healing walks, soil biology, and upcoming summer community projects.',
      'Q3': 'Summer Harvest — Lavender harvest & essential oils, industrial hemp phytoremediation, medicinal herb benefits (calm, digestion, immune support), and progress on farm infrastructure.',
      'Q4': 'Fall Reflection — Soil regeneration results, year in review, community impact, winter wellness tips with lavender & herbal teas, and previewing next year’s campus milestones.'
    };

    const qKey = Object.keys(seasonalPrompts).find(k => quarter.includes(k)) || 'Q3';
    const seasonFocus = seasonalPrompts[qKey];

    const prompt = `You are writing a quarterly email newsletter draft for "Re-Thinking The Leaf" — a 66-acre agrotherapy estate in Lawrenceville, Brunswick County, Virginia led by Shardell Gerald.

Focus for this issue (${quarter}): ${seasonFocus}

Please return a JSON object with the following exact keys (no markdown formatting around JSON):
{
  "subject": "Compelling subject line under 60 chars",
  "farmUpdate": "2-3 paragraphs about farm status, land stewardship, and current campus development.",
  "plantSpotlight": "2-3 paragraphs highlighting benefits of lavender, hemp, or medicinal herbs.",
  "soilTip": "1-2 paragraphs about regenerative soil health, building organic matter, or circular farm economy (Groundswell principles).",
  "whatsAhead": "1-2 paragraphs about upcoming seasonal milestones and community opportunities.",
  "callToAction": "Inspiring closing sentence encouraging community involvement or visiting rethinkingtheleaf.com"
}`;

    const geminiResp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' }
      })
    });

    const geminiData = await geminiResp.json();
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const parsed = JSON.parse(rawText);

    return new Response(JSON.stringify({
      success: true,
      quarter,
      draft: parsed,
      generatedAt: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('Newsletter draft error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export const config = {
  path: '/api/newsletter-draft'
};
