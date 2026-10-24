// Rename this file to api/script.js in your GitHub repo.
// Needs an environment variable named ANTHROPIC_API_KEY in your Vercel project settings.

const SHAPES = {
  quote: {
    fields: '["<the quote, max 18 words>", "<author name, or empty string>"]',
    note: 'A short, memorable quote or punchy statement about the topic.'
  },
  explainer: {
    fields: '["<title, max 8 words>", "<step 1, max 7 words>", "<step 2, max 7 words>", "<step 3, max 7 words>"]',
    note: 'A 3-step explainer.'
  },
  promo: {
    fields: '["<brand name>", "<headline, max 8 words>", "<offer, max 5 words>", "<button text, max 3 words>"]',
    note: 'A short ad for a client. If no brand name is given, invent a plausible short one from the topic.'
  }
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not set in Vercel.' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const topic = String(body.topic || '').slice(0, 300).trim();
  const shape = SHAPES[body.template];
  if (!topic || !shape) return res.status(400).json({ error: 'Missing topic or template.' });

  const system =
    'You write scripts for short vertical videos. Reply with ONLY a JSON object, no markdown and no extra text. ' +
    'Format: {"fields": ' + shape.fields + ', "voiceover": "<narration>"}. ' +
    shape.note + ' The voiceover is 30 to 45 words, natural spoken English, matches the on-screen text, ' +
    'has no emojis, no hashtags and no stage directions.';

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5-5',
        max_tokens: 700,
        system,
        messages: [{ role: 'user', content: 'Topic: ' + topic }]
      })
    });
    const data = await r.json();
    if (!r.ok) return res.status(502).json({ error: (data.error && data.error.message) || 'The AI request failed.' });

    const text = (data.content || []).map(c => c.text || '').join('').replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(text);
    return res.status(200).json({ fields: parsed.fields, voiceover: parsed.voiceover });
  } catch (e) {
    return res.status(500).json({ error: 'Could not read the AI answer. Try again.' });
  }
};
  
