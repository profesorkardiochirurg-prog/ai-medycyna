import crypto from 'crypto';

const BOT_TOKEN = process.env.BOT_TOKEN;
const ALLOWED_CHAT_ID = String(process.env.ALLOWED_CHAT_ID || '');
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const LINKEDIN_ACCESS_TOKEN = process.env.LINKEDIN_ACCESS_TOKEN;
const LINKEDIN_USER_ID = process.env.LINKEDIN_USER_ID;
const TWITTER_API_KEY = process.env.TWITTER_API_KEY;
const TWITTER_API_SECRET = process.env.TWITTER_API_SECRET;
const TWITTER_ACCESS_TOKEN = process.env.TWITTER_ACCESS_TOKEN;
const TWITTER_ACCESS_TOKEN_SECRET = process.env.TWITTER_ACCESS_TOKEN_SECRET;
const REPO_OWNER = 'profesorkardiochirurg-prog';
const REPO_NAME = 'ai-medycyna';
const SITE_URL = 'https://ai-medycyna.vercel.app';

// Hardcoded demo drafts — will be replaced by real generator in Faza 2.
const DEMO_DRAFTS = {
  'jacc-imaging': {
    title: 'Architektury głębokiego uczenia w analizie obrazów serca — przegląd JACC',
    date: '2026-05-02',
    tags: ['kardiologia', 'sztuczna inteligencja', 'obrazowanie'],
    excerpt: 'Przegląd z JACC Cardiovascular Imaging porządkuje aktualne architektury głębokiego uczenia w analizie obrazów serca i pokazuje, gdzie kończy się obietnica, a zaczyna kliniczne zastosowanie.',
    image: 'https://images.unsplash.com/photo-1758691463165-ca9b5bc2b28a?w=1600&h=900&fit=crop&q=80',
    imageAlt: 'Lekarz analizujący obraz rezonansu magnetycznego na ekranie laptopa',
    imageOverlay: {
      stats: [
        { num: '3', label: 'typy zastosowań' },
        { num: '12–24', label: 'miesiące synteza' },
      ],
      summary: 'Co głębokie uczenie naprawdę zmienia w obrazowaniu serca',
    },
    bodyParagraphs: [
      'JACC Cardiovascular Imaging opublikował 24 kwietnia 2026 przegląd dotyczący aktualnego stanu architektur głębokiego uczenia w analizie obrazów serca. Tempo rozwoju w tej dziedzinie wymusza takie syntezy co 12–24 miesiące.',
      'Autorzy uporządkowali metody według trzech zastosowań: segmentacji, klasyfikacji oraz oceny ryzyka i wyników klinicznych. Podkreślają, że wzrost dokładności modelu w warunkach laboratoryjnych nie przekłada się automatycznie na korzyść kliniczną.',
      'Najwięcej obietnic, ale i pułapek, widać w architekturach transformerowych i modelach foundation. Praca z różnymi modalnościami (tomografia komputerowa, rezonans magnetyczny, echokardiografia, scyntygrafia) wymaga walidacji w lokalnym workflow, a nie tylko na publicznych zbiorach danych.',
      'Z punktu widzenia kardiochirurga przegląd jest praktyczny: wskazuje, na jakim etapie są poszczególne metody i które są bliskie wdrożenia w realnym szpitalu, a które wciąż czekają na walidację kliniczną.',
    ],
    sourceText: 'van der Zande JL, Alvarez-Florez L, Volleberg RHJA et al. Deep Learning for Cardiac Image Analysis: Unveiling Advances in Deep Learning Architectures. JACC Cardiovasc Imaging. 2026 Apr 24.',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/42065698/',
    linkedinPost:
`Czy to jest moment, w którym głębokie uczenie w obrazowaniu serca przechodzi z laboratorium do szpitala?

Przegląd opublikowany 24 kwietnia w JACC Cardiovascular Imaging mapuje aktualny stan architektur głębokiego uczenia w kardiologii.

Co warte uwagi:
✅ Metody uporządkowane według zastosowań: segmentacja, klasyfikacja, ocena ryzyka i wyniki kliniczne
✅ Architektury transformerowe i modele foundation — najwięcej obietnic, najwięcej pułapek
✅ Walidacja musi się dziać w lokalnym workflow, nie tylko na publicznych zbiorach

[TU TWOJA UWAGA Z SALI: np. które z tych metod widzisz już w praktyce klinicznej, a które są nadal demo na konferencjach]

Praktyczny przegląd dla każdego, kto myśli o wdrożeniu sztucznej inteligencji w obrazowaniu serca w realnym szpitalu.

Link w komentarzu.

#kardiologia #kardiochirurgia #AIinMedicine #obrazowanie #medycyna`,
  },
};

async function tg(method, payload) {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

// ============ X (Twitter) helpers ============

function rfc3986(str) {
  return encodeURIComponent(String(str))
    .replace(/!/g, '%21')
    .replace(/\*/g, '%2A')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29');
}

function buildTwitterAuthHeader(method, url, extraOauthParams = {}) {
  const oauthParams = {
    oauth_consumer_key: TWITTER_API_KEY,
    oauth_nonce: crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: TWITTER_ACCESS_TOKEN,
    oauth_version: '1.0',
    ...extraOauthParams,
  };

  const paramString = Object.keys(oauthParams)
    .sort()
    .map(k => `${rfc3986(k)}=${rfc3986(oauthParams[k])}`)
    .join('&');

  const baseString = [
    method.toUpperCase(),
    rfc3986(url),
    rfc3986(paramString),
  ].join('&');

  const signingKey = `${rfc3986(TWITTER_API_SECRET)}&${rfc3986(TWITTER_ACCESS_TOKEN_SECRET)}`;

  const signature = crypto.createHmac('sha1', signingKey).update(baseString).digest('base64');
  oauthParams.oauth_signature = signature;

  const headerParams = Object.keys(oauthParams)
    .sort()
    .map(k => `${rfc3986(k)}="${rfc3986(oauthParams[k])}"`)
    .join(', ');

  return 'OAuth ' + headerParams;
}

function composeTweet(draft, articleUrl) {
  // First non-empty line of linkedinPost is typically the hook
  const lines = (draft.linkedinPost || '').split('\n').map(l => l.trim()).filter(Boolean);
  let hook = lines[0] || draft.title;

  // Extract hashtags from linkedinPost (agent's curated set, usually 3-5)
  const linkedinHashtags = (draft.linkedinPost || '').match(/#\w+/g) || [];

  // Build hashtag line (cap at ~80 chars budget to leave room for hook)
  let tagsLine = '';
  let used = 0;
  for (const tag of linkedinHashtags) {
    if (used + tag.length + 1 > 80) break;
    tagsLine = tagsLine ? `${tagsLine} ${tag}` : tag;
    used += tag.length + 1;
  }
  if (!tagsLine) {
    tagsLine = '#kardiologia #AIinMedicine';
  }

  // X URL shortener t.co counts every URL as 23 chars
  const URL_BUDGET = 23 + 2; // url + 2 newlines
  const TAGS_BUDGET = tagsLine.length + 2; // tags + 2 newlines
  const maxHook = 280 - URL_BUDGET - TAGS_BUDGET;

  if (hook.length > maxHook) {
    hook = hook.slice(0, maxHook - 1).replace(/\s\S*$/, '') + '…';
  }

  return `${hook}\n\n${articleUrl}\n\n${tagsLine}`;
}

async function uploadImageToTwitter(imageUrl) {
  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) throw new Error(`Image fetch ${imgRes.status}`);
  const imgBuffer = Buffer.from(await imgRes.arrayBuffer());

  const uploadUrl = 'https://upload.twitter.com/1.1/media/upload.json';

  const boundary = '----TwitterFormBoundary' + crypto.randomBytes(8).toString('hex');
  const headerStr = [
    `--${boundary}`,
    'Content-Disposition: form-data; name="media"; filename="image.jpg"',
    'Content-Type: image/jpeg',
    '',
    '',
  ].join('\r\n');
  const footerStr = `\r\n--${boundary}--\r\n`;

  const body = Buffer.concat([
    Buffer.from(headerStr, 'utf-8'),
    imgBuffer,
    Buffer.from(footerStr, 'utf-8'),
  ]);

  // OAuth 1.0a signature — for multipart uploads, body params NOT included in signature base
  const authHeader = buildTwitterAuthHeader('POST', uploadUrl);

  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
    },
    body,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Twitter media ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  return data.media_id_string;
}

async function postToTwitter(tweetText, imageUrl) {
  if (!TWITTER_API_KEY || !TWITTER_API_SECRET || !TWITTER_ACCESS_TOKEN || !TWITTER_ACCESS_TOKEN_SECRET) {
    throw new Error('Twitter API credentials not configured');
  }

  // Try to upload image first; if fails, fall back to text-only tweet
  let mediaId = null;
  let imageError = null;
  if (imageUrl) {
    try {
      mediaId = await uploadImageToTwitter(imageUrl);
    } catch (err) {
      imageError = err.message;
      console.error('Twitter image upload failed, falling back to text-only:', err);
    }
  }

  const url = 'https://api.twitter.com/2/tweets';
  const authHeader = buildTwitterAuthHeader('POST', url);

  const tweetBody = mediaId
    ? { text: tweetText, media: { media_ids: [mediaId] } }
    : { text: tweetText };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
      'User-Agent': 'ai-medycyna-bot',
    },
    body: JSON.stringify(tweetBody),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Twitter ${res.status}: ${errText.slice(0, 300)}`);
  }

  const data = await res.json();
  const tweetId = data?.data?.id;
  const tweetUrl = tweetId ? `https://x.com/i/status/${tweetId}` : 'https://x.com';
  return { url: tweetUrl, withImage: !!mediaId, imageError };
}

// ============ LinkedIn helpers ============

async function uploadImageToLinkedIn(imageUrl) {
  // 1. Register upload
  const initRes = await fetch('https://api.linkedin.com/v2/assets?action=registerUpload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LINKEDIN_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify({
      registerUploadRequest: {
        recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
        owner: `urn:li:person:${LINKEDIN_USER_ID}`,
        serviceRelationships: [{
          relationshipType: 'OWNER',
          identifier: 'urn:li:userGeneratedContent',
        }],
      },
    }),
  });

  if (!initRes.ok) {
    const t = await initRes.text();
    throw new Error(`registerUpload ${initRes.status}: ${t.slice(0, 200)}`);
  }

  const initData = await initRes.json();
  const uploadUrl =
    initData?.value?.uploadMechanism?.['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest']?.uploadUrl;
  const assetUrn = initData?.value?.asset;

  if (!uploadUrl || !assetUrn) {
    throw new Error('registerUpload zwrocil nieoczekiwany format');
  }

  // 2. Fetch image bytes from Unsplash
  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) {
    throw new Error(`Pobranie obrazu z Unsplash ${imgRes.status}`);
  }
  const imgBuffer = await imgRes.arrayBuffer();

  // 3. Upload to LinkedIn
  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${LINKEDIN_ACCESS_TOKEN}`,
    },
    body: Buffer.from(imgBuffer),
  });

  if (!uploadRes.ok) {
    const t = await uploadRes.text();
    throw new Error(`Upload obrazu ${uploadRes.status}: ${t.slice(0, 200)}`);
  }

  return assetUrn;
}

async function postToLinkedIn(text, articleUrl, articleTitle, articleExcerpt, imageUrl) {
  if (!LINKEDIN_ACCESS_TOKEN || !LINKEDIN_USER_ID) {
    throw new Error('LinkedIn nieskonfigurowany (brak tokena lub user ID)');
  }

  // Try to upload image first; if it fails, fall back to ARTICLE category with link preview.
  let assetUrn = null;
  let imageError = null;
  if (imageUrl) {
    try {
      assetUrn = await uploadImageToLinkedIn(imageUrl);
    } catch (err) {
      imageError = err.message;
      console.error('Image upload failed, falling back to ARTICLE:', err);
    }
  }

  // When using IMAGE category, embed URL in body since there's no link preview.
  const fullText = assetUrn
    ? `${text}\n\nCzytaj na: ${articleUrl}`
    : text;

  const postBody = {
    author: `urn:li:person:${LINKEDIN_USER_ID}`,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: { text: fullText },
        shareMediaCategory: assetUrn ? 'IMAGE' : 'ARTICLE',
        media: [
          assetUrn
            ? {
                status: 'READY',
                media: assetUrn,
                title: { text: articleTitle.slice(0, 200) },
                description: { text: (articleExcerpt || '').slice(0, 256) },
              }
            : {
                status: 'READY',
                originalUrl: articleUrl,
                title: { text: articleTitle.slice(0, 200) },
                description: { text: (articleExcerpt || '').slice(0, 256) },
              },
        ],
      },
    },
    visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
  };

  const liRes = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LINKEDIN_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify(postBody),
  });

  if (!liRes.ok) {
    const errText = await liRes.text();
    throw new Error(`LinkedIn ${liRes.status}: ${errText.slice(0, 300)}`);
  }

  const data = await liRes.json();
  const postId = data.id || liRes.headers.get('x-restli-id') || liRes.headers.get('x-linkedin-id');
  const url = postId
    ? `https://www.linkedin.com/feed/update/${encodeURIComponent(postId)}/`
    : 'https://www.linkedin.com/feed/';

  return { url, withImage: !!assetUrn, imageError };
}

async function getDraftFromRepo(id) {
  const res = await ghApi(`contents/_drafts/${id}.json`);
  if (!res.ok) return null;
  const data = await res.json();
  try {
    const draft = JSON.parse(Buffer.from(data.content, 'base64').toString('utf-8'));
    return { ...draft, _githubSha: data.sha };
  } catch (e) {
    console.error('Parse draft error:', e);
    return null;
  }
}

async function deleteDraftFile(id, sha) {
  if (!sha) return;
  await ghApi(`contents/_drafts/${id}.json`, {
    method: 'DELETE',
    body: JSON.stringify({
      message: `Draft handled: ${id}`,
      sha,
    }),
  });
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

function escape(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function formatDate(iso) {
  const months = ['stycznia','lutego','marca','kwietnia','maja','czerwca','lipca','sierpnia','września','października','listopada','grudnia'];
  const d = new Date(iso);
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function buildOverlay(overlay) {
  if (!overlay) return '';
  const stats = (overlay.stats || []).map(s =>
    `<div class="stat"><span class="num">${escape(s.num)}</span><span class="label">${escape(s.label)}</span></div>`
  ).join('\n        ');
  return `<div class="overlay">
      <div class="stats">
        ${stats}
      </div>
      <p class="summary">${escape(overlay.summary || '')}</p>
    </div>`;
}

function buildArticleHtml(draft, slug) {
  const tags = draft.tags.map(t => `<span class="tag">${escape(t)}</span>`).join('\n      ');
  const paras = draft.bodyParagraphs.map(p => `<p>${escape(p)}</p>`).join('\n    ');
  const dateFormatted = formatDate(draft.date);
  const heroImage = draft.image
    ? `<figure class="hero-image">
    <img src="${escape(draft.image)}" alt="${escape(draft.imageAlt || draft.title)}" loading="eager">
    ${buildOverlay(draft.imageOverlay)}
  </figure>`
    : '';

  // OpenGraph image: prefer the article's hero image (Unsplash). Optimize for 1200x630.
  const ogImage = draft.image
    ? draft.image.replace(/[?&](w|h|fit|q)=[^&]*/g, '').replace(/\?+$/, '') + '?w=1200&h=630&fit=crop&q=80'
    : `${SITE_URL}/og-default.jpg`;
  const articleUrl = slug ? `${SITE_URL}/articles/${slug}.html` : SITE_URL;

  return `<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escape(draft.title)} | Inteligentny Skalpel</title>
<meta name="description" content="${escape(draft.excerpt)}">
<meta property="og:type" content="article">
<meta property="og:title" content="${escape(draft.title)}">
<meta property="og:description" content="${escape(draft.excerpt)}">
<meta property="og:image" content="${escape(ogImage)}">
<meta property="og:url" content="${escape(articleUrl)}">
<meta property="og:site_name" content="Inteligentny Skalpel">
<meta property="og:locale" content="pl_PL">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escape(draft.title)}">
<meta name="twitter:description" content="${escape(draft.excerpt)}">
<meta name="twitter:image" content="${escape(ogImage)}">
<link rel="stylesheet" href="../assets/styles.css">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>

<header class="masthead masthead-compact">
  <div class="wrap">
    <a href="../index.html" class="wordmark-link" aria-label="Inteligentny Skalpel — strona główna">
      <h1 class="wordmark">Inteligentny Skalpel</h1>
    </a>
    <nav class="topnav">
      <a href="../index.html#artykuly">Artykuły</a>
      <a href="../index.html#o-autorze">O autorze</a>
      <a href="https://www.linkedin.com/in/rados%C5%82aw-litwinowicz-0b57b8262" target="_blank" rel="noopener">LinkedIn</a>
      <a href="https://x.com/BehindScalpel" target="_blank" rel="noopener">X</a>
    </nav>
  </div>
</header>

<article class="wrap article-page">

  <a class="back" href="../index.html#artykuly">← Wszystkie artykuły</a>

  ${heroImage}

  <div class="meta">
    <time>${dateFormatted}</time>
    ${tags}
  </div>

  <h1>${escape(draft.title)}</h1>

  <div class="article-content">

    ${paras}

    <div class="source-box">
      <strong>Źródło</strong>
      ${escape(draft.sourceText)}<br>
      <a href="${escape(draft.sourceUrl)}" target="_blank" rel="noopener">PubMed →</a>
    </div>

  </div>

</article>

<footer class="site-footer">
  <div class="wrap">
    <p class="footer-mark">Inteligentny Skalpel</p>
    <p class="footer-copy">© 2026 Radosław Litwinowicz · <a href="https://www.linkedin.com/in/rados%C5%82aw-litwinowicz-0b57b8262" target="_blank" rel="noopener">LinkedIn</a> · <a href="https://x.com/BehindScalpel" target="_blank" rel="noopener">X</a></p>
  </div>
</footer>

</body>
</html>
`;
}

async function publishDraft(draftId, draft) {
  if (!draft) throw new Error(`No draft to publish: ${draftId}`);

  const ts = Date.now().toString(36);
  let safeId = String(draftId).replace(/[^a-z0-9-]/gi, '');
  // If draftId already starts with the date (from injected drafts), don't double-prefix.
  const datePrefix = `${draft.date}-`;
  let slugBase = safeId.startsWith(datePrefix) ? safeId : `${draft.date}-${safeId || 'post'}`;
  const slug = `${slugBase}-${ts}`;
  const articlePath = `articles/${slug}.html`;
  const html = buildArticleHtml(draft, slug);

  // 1. Create new article HTML file
  const articleContent = Buffer.from(html, 'utf-8').toString('base64');
  const createRes = await ghApi(`contents/${articlePath}`, {
    method: 'PUT',
    body: JSON.stringify({
      message: `Publish: ${draft.title}`,
      content: articleContent,
    }),
  });
  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Create article failed: ${createRes.status} ${err}`);
  }

  // 2. Get current articles.json
  const idxRes = await ghApi('contents/articles.json');
  if (!idxRes.ok) throw new Error('Fetch articles.json failed');
  const idxData = await idxRes.json();
  const currentArticles = JSON.parse(
    Buffer.from(idxData.content, 'base64').toString('utf-8')
  );

  // 3. Prepend new entry
  currentArticles.unshift({
    slug,
    title: draft.title,
    date: draft.date,
    tags: draft.tags,
    excerpt: draft.excerpt,
    image: draft.image || null,
    imageAlt: draft.imageAlt || null,
    imageOverlay: draft.imageOverlay || null,
  });

  const newIdxContent = Buffer.from(
    JSON.stringify(currentArticles, null, 2),
    'utf-8'
  ).toString('base64');

  // 4. Update articles.json
  const updateRes = await ghApi('contents/articles.json', {
    method: 'PUT',
    body: JSON.stringify({
      message: `Index: ${draft.title}`,
      content: newIdxContent,
      sha: idxData.sha,
    }),
  });
  if (!updateRes.ok) {
    const err = await updateRes.text();
    throw new Error(`Update index failed: ${updateRes.status} ${err}`);
  }

  return `${SITE_URL}/articles/${slug}.html`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).json({
      ok: true,
      info: 'Telegram webhook endpoint. POST only.',
    });
  }

  if (!BOT_TOKEN || !ALLOWED_CHAT_ID) {
    console.error('Missing env vars: BOT_TOKEN or ALLOWED_CHAT_ID');
    return res.status(200).json({ ok: true });
  }

  try {
    const update = req.body || {};

    // Handle text messages (commands)
    if (update.message) {
      const msg = update.message;
      const chatId = String(msg.chat.id);

      if (chatId !== ALLOWED_CHAT_ID) {
        return res.status(200).json({ ok: true });
      }

      const text = (msg.text || '').trim();

      if (text === '/start') {
        await tg('sendMessage', {
          chat_id: chatId,
          text:
`Bot uruchomiony.

Komendy:
/draft — pokaż przykładowy draft do akceptacji
/test — sprawdź czy bot odbiera
/echo coś — odeśle "coś"

W kolejnym kroku scheduled task będzie sam wrzucał drafty 2× dziennie. Na razie ćwiczymy flow akceptacji.`,
        });
      } else if (text === '/test') {
        await tg('sendMessage', {
          chat_id: chatId,
          text: '✅ Test OK. Bot odbiera i odpowiada.',
        });
      } else if (text.startsWith('/echo ')) {
        await tg('sendMessage', {
          chat_id: chatId,
          text: text.slice(6),
        });
      } else if (text === '/draft') {
        const draft = DEMO_DRAFTS['jacc-imaging'];
        const preview =
`📄 *Draft do akceptacji*

*${draft.title}*

${draft.excerpt}

_Tagi: ${draft.tags.join(', ')}_
_Źródło: JACC Cardiovascular Imaging (2026-04-24)_

Po Publikuj artykuł trafi na stronę i dostaniesz osobno tekst LinkedIn do skopiowania.`;
        await tg('sendMessage', {
          chat_id: chatId,
          text: preview,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[
              { text: '✅ Publikuj', callback_data: 'publish:jacc-imaging' },
              { text: '❌ Odrzuć', callback_data: 'reject:jacc-imaging' },
            ]],
          },
        });
      } else if (text) {
        await tg('sendMessage', {
          chat_id: chatId,
          text: 'Nie rozumiem. Spróbuj /start żeby zobaczyć komendy.',
        });
      }
    }

    // Handle button callbacks
    if (update.callback_query) {
      const cq = update.callback_query;
      const chatId = String(cq.message.chat.id);

      if (chatId !== ALLOWED_CHAT_ID) {
        return res.status(200).json({ ok: true });
      }

      const data = cq.data || '';
      const [action, draftId] = data.split(':');

      // Acknowledge the click immediately
      await tg('answerCallbackQuery', {
        callback_query_id: cq.id,
        text: action === 'publish' ? 'Publikuję…' : 'Odrzucone',
      });

      // Disable buttons on original message
      await tg('editMessageReplyMarkup', {
        chat_id: chatId,
        message_id: cq.message.message_id,
        reply_markup: { inline_keyboard: [] },
      });

      if (action === 'publish') {
        try {
          // Find draft: DEMO first, then _drafts/ in repo
          let draft = DEMO_DRAFTS[draftId];
          let fromRepo = false;
          if (!draft) {
            draft = await getDraftFromRepo(draftId);
            fromRepo = !!draft;
          }
          if (!draft) {
            await tg('sendMessage', {
              chat_id: chatId,
              text: `❌ Draft \`${draftId}\` nie znaleziony (może już opublikowany lub odrzucony).`,
              parse_mode: 'Markdown',
            });
            return res.status(200).json({ ok: true });
          }

          const url = await publishDraft(draftId, draft);

          // Delete draft file from _drafts/ if it came from repo
          if (fromRepo && draft._githubSha) {
            try {
              await deleteDraftFile(draftId, draft._githubSha);
            } catch (e) {
              console.error('Delete draft file failed (non-fatal):', e);
            }
          }

          await tg('sendMessage', {
            chat_id: chatId,
            text: `✅ *Opublikowano na stronie*\n\n${url}\n\n_Vercel deployuje ~30 sek._`,
            parse_mode: 'Markdown',
          });

          if (draft && draft.linkedinPost && LINKEDIN_ACCESS_TOKEN && LINKEDIN_USER_ID) {
            try {
              const liResult = await postToLinkedIn(
                draft.linkedinPost,
                url,
                draft.title,
                draft.excerpt,
                draft.image,
              );
              const imgStatus = liResult.withImage
                ? '✅ z obrazem (upload do LinkedIn)'
                : `⚠️ bez obrazu (link preview, fallback): ${liResult.imageError || 'brak obrazu'}`;
              await tg('sendMessage', {
                chat_id: chatId,
                text: `✅ *Opublikowano na LinkedIn*\n\n${liResult.url}\n\n_${imgStatus}_`,
                parse_mode: 'Markdown',
                disable_web_page_preview: false,
              });
            } catch (liErr) {
              console.error('LinkedIn post error:', liErr);
              await tg('sendMessage', {
                chat_id: chatId,
                text: `⚠️ *Błąd LinkedIn*: ${liErr.message}`,
                parse_mode: 'Markdown',
              });
            }
          }

          // Post to X (Twitter)
          if (draft && TWITTER_API_KEY && TWITTER_ACCESS_TOKEN) {
            try {
              const tweetText = composeTweet(draft, url);
              const twResult = await postToTwitter(tweetText, draft.image);
              const twImgStatus = twResult.withImage
                ? '✅ z obrazem (upload do X)'
                : `⚠️ bez obrazu: ${twResult.imageError || 'brak obrazu w drafcie'}`;
              await tg('sendMessage', {
                chat_id: chatId,
                text: `✅ *Opublikowano na X*\n\n${twResult.url}\n\n_${twImgStatus}_`,
                parse_mode: 'Markdown',
              });
            } catch (twErr) {
              console.error('Twitter post error:', twErr);
              await tg('sendMessage', {
                chat_id: chatId,
                text: `⚠️ *Błąd X*: ${twErr.message}`,
                parse_mode: 'Markdown',
              });
            }
          }

        } catch (err) {
          console.error('Publish error:', err);
          await tg('sendMessage', {
            chat_id: chatId,
            text: `❌ Błąd publikacji: ${err.message}`,
          });
        }
      } else if (action === 'reject') {
        // If draft is in _drafts/ repo, delete it
        try {
          const draft = await getDraftFromRepo(draftId);
          if (draft && draft._githubSha) {
            await deleteDraftFile(draftId, draft._githubSha);
          }
        } catch (e) {
          console.error('Delete rejected draft failed (non-fatal):', e);
        }
        await tg('sendMessage', {
          chat_id: chatId,
          text: '❌ Odrzucone — draft nie zostanie opublikowany i został usunięty z kolejki.',
        });
      }
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Telegram handler error:', err);
    return res.status(200).json({ ok: true });
  }
}
