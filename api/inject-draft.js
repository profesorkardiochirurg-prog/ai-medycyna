const BOT_TOKEN = process.env.BOT_TOKEN;
const ALLOWED_CHAT_ID = String(process.env.ALLOWED_CHAT_ID || '');
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const INJECT_SECRET = process.env.INJECT_SECRET;
const REPO_OWNER = 'profesorkardiochirurg-prog';
const REPO_NAME = 'ai-medycyna';

async function tg(method, payload) {
  const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return r.json();
}

async function ghApi(path, options = {}) {
  return fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'User-Agent': 'ai-medycyna-bot',
      ...(options.headers || {}),
    },
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'POST only. Send a JSON draft body with Authorization: Bearer <INJECT_SECRET>.' });
  }

  if (!INJECT_SECRET) {
    return res.status(500).json({ ok: false, error: 'INJECT_SECRET nie skonfigurowany na Vercelu.' });
  }

  const auth = req.headers.authorization || '';
  if (auth !== `Bearer ${INJECT_SECRET}`) {
    return res.status(401).json({ ok: false, error: 'Unauthorized — niewlasciwy lub brak Authorization header.' });
  }

  const draft = req.body || {};
  const required = [
    'title', 'date', 'tags', 'excerpt',
    'image', 'imageAlt', 'imageOverlay',
    'bodyParagraphs', 'sourceText', 'sourceUrl',
    'linkedinPost',
  ];
  const missing = required.filter(f => !draft[f]);
  if (missing.length) {
    return res.status(400).json({
      ok: false,
      error: `Missing required fields: ${missing.join(', ')}`,
      schema: required,
    });
  }

  const idSuffix = Math.random().toString(36).slice(2, 10);
  const id = `${draft.date}-${idSuffix}`;
  const draftPath = `_drafts/${id}.json`;

  try {
    const content = Buffer.from(JSON.stringify(draft, null, 2), 'utf-8').toString('base64');
    const createRes = await ghApi(`contents/${draftPath}`, {
      method: 'PUT',
      body: JSON.stringify({
        message: `Draft inject: ${draft.title}`.slice(0, 100),
        content,
      }),
    });
    if (!createRes.ok) {
      const err = await createRes.text();
      return res.status(500).json({ ok: false, error: `Save draft failed: ${err.slice(0, 300)}` });
    }

    const sourceShort = (draft.sourceText || '').slice(0, 180);
    const preview = `📄 *Nowy draft do akceptacji*

*${draft.title}*

${draft.excerpt}

_Tagi:_ ${draft.tags.join(', ')}
_Źródło:_ ${sourceShort}`;

    await tg('sendMessage', {
      chat_id: ALLOWED_CHAT_ID,
      text: preview,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[
          { text: '✅ Publikuj', callback_data: `publish:${id}` },
          { text: '❌ Odrzuć', callback_data: `reject:${id}` },
        ]],
      },
    });

    return res.status(200).json({
      ok: true,
      id,
      draftPath,
      message: 'Draft zapisany w repo i wyslany na Telegram.',
    });
  } catch (err) {
    console.error('Inject error:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
