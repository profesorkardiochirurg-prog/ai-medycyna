import crypto from 'crypto';

const BOT_TOKEN = process.env.BOT_TOKEN;
const ALLOWED_CHAT_ID = String(process.env.ALLOWED_CHAT_ID || '');
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const LINKEDIN_ACCESS_TOKEN = process.env.LINKEDIN_ACCESS_TOKEN;
const LINKEDIN_USER_ID = process.env.LINKEDIN_USER_ID;
const TWITTER_API_KEY = process.env.TWITTER_API_KEY;
const TWITTER_API_SECRET = process.env.TWITTER_API_SECRET;
const TWITTER_ACCESS_TOKEN = process.env.TWITTER_ACCESS_TOKEN;
const TWITTER_ACCESS_TOKEN_SECRET = process.env.TWITTER_ACCESS_TOKEN_SECRET;
const REPO_OWNER = 'profesorkardiochirurg-prog';
const REPO_NAME = 'ai-medycyna';
const SITE_URL = 'https://ai-medycyna.vercel.app';

function escape(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function formatDate(iso) {
  const months = ['stycznia','lutego','marca','kwietnia','maja','czerwca','lipca','sierpnia','września','października','listopada','grudnia'];
  const d = new Date(iso);
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

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
      'User-Agent': 'ai-medycyna-admin',
      ...(options.headers || {}),
    },
  });
}

function buildOverlay(overlay) {
  if (!overlay || !overlay.stats) return '';
  const stats = overlay.stats.map(s =>
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
  const tags = (draft.tags || []).map(t => `<span class="tag">${escape(t)}</span>`).join('\n      ');
  const paras = (draft.bodyParagraphs || []).map(p => `<p>${escape(p)}</p>`).join('\n    ');
  const dateFormatted = formatDate(draft.date);
  const heroImage = draft.image
    ? `<figure class="hero-image">
    <img src="${escape(draft.image)}" alt="${escape(draft.imageAlt || draft.title)}" loading="eager">
    ${buildOverlay(draft.imageOverlay)}
  </figure>`
    : '';

  const ogImage = draft.image
    ? draft.image.replace(/[?&](w|h|fit|q)=[^&]*/g, '').replace(/\?+$/, '') + '?w=1200&h=630&fit=crop&q=80'
    : `${SITE_URL}/og-default.jpg`;
  const articleUrl = `${SITE_URL}/articles/${slug}.html`;

  return `<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escape(draft.title)} | Radosław Litwinowicz</title>
<meta name="description" content="${escape(draft.excerpt)}">
<meta property="og:type" content="article">
<meta property="og:title" content="${escape(draft.title)}">
<meta property="og:description" content="${escape(draft.excerpt)}">
<meta property="og:image" content="${escape(ogImage)}">
<meta property="og:url" content="${escape(articleUrl)}">
<meta property="og:site_name" content="Radosław Litwinowicz">
<meta property="og:locale" content="pl_PL">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escape(draft.title)}">
<meta name="twitter:description" content="${escape(draft.excerpt)}">
<meta name="twitter:image" content="${escape(ogImage)}">
<link rel="stylesheet" href="../assets/styles.css">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
</head>
<body>

<header class="topbar">
  <div class="topbar-inner">
    <a href="../index.html" class="topbar-brand">
      <span class="brand-mark">RL</span>
      <span class="brand-name">Radosław Litwinowicz</span>
    </a>
    <nav class="topbar-nav">
      <a href="../index.html#artykuly">Artykuły</a>
    </nav>
  </div>
</header>

<article class="wrap-narrow article-page">
 <div class="article-shell">

  ${heroImage}

  <div class="article-content-wrap">

  <a class="back" href="../index.html#artykuly">← Wszystkie artykuły</a>

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
      <a href="${escape(draft.sourceUrl)}" target="_blank" rel="noopener">Link →</a>
    </div>

  </div>

  </div>
 </div>

</article>

<footer class="site-footer">
  <div class="wrap">
    <p class="footer-mark">Radosław Litwinowicz</p>
    <p class="footer-copy">© 2026 · Kardiochirurg · AI w medycynie</p>
  </div>
</footer>

</body>
</html>
`;
}

async function publishToWebsite(draft) {
  const ts = Date.now().toString(36);
  const dateSlug = (draft.date || '').replace(/[^0-9-]/g, '');
  const titleSlug = (draft.title || 'post')
    .toLowerCase()
    .replace(/[ąćęłńóśźż]/g, c => ({'ą':'a','ć':'c','ę':'e','ł':'l','ń':'n','ó':'o','ś':'s','ź':'z','ż':'z'}[c]))
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  const slug = `${dateSlug}-${titleSlug}-${ts}`;
  const articlePath = `articles/${slug}.html`;
  const html = buildArticleHtml(draft, slug);

  const articleContent = Buffer.from(html, 'utf-8').toString('base64');
  const createRes = await ghApi(`contents/${articlePath}`, {
    method: 'PUT',
    body: JSON.stringify({
      message: `Publish (admin): ${draft.title}`.slice(0, 100),
      content: articleContent,
    }),
  });
  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Create article failed: ${createRes.status} ${err.slice(0, 200)}`);
  }

  const idxRes = await ghApi('contents/articles.json');
  if (!idxRes.ok) throw new Error('Fetch articles.json failed');
  const idxData = await idxRes.json();
  const currentArticles = JSON.parse(Buffer.from(idxData.content, 'base64').toString('utf-8'));

  currentArticles.unshift({
    slug,
    title: draft.title,
    date: draft.date,
    tags: draft.tags || [],
    excerpt: draft.excerpt,
    image: draft.image || null,
    imageAlt: draft.imageAlt || null,
    imageOverlay: draft.imageOverlay || null,
  });

  const newIdxContent = Buffer.from(
    JSON.stringify(currentArticles, null, 2),
    'utf-8'
  ).toString('base64');

  const updateRes = await ghApi('contents/articles.json', {
    method: 'PUT',
    body: JSON.stringify({
      message: `Index (admin): ${draft.title}`.slice(0, 100),
      content: newIdxContent,
      sha: idxData.sha,
    }),
  });
  if (!updateRes.ok) {
    const err = await updateRes.text();
    throw new Error(`Update index failed: ${updateRes.status} ${err.slice(0, 200)}`);
  }

  return `${SITE_URL}/articles/${slug}.html`;
}

async function uploadImageToLinkedIn(imageUrl) {
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
        serviceRelationships: [{ relationshipType: 'OWNER', identifier: 'urn:li:userGeneratedContent' }],
      },
    }),
  });
  if (!initRes.ok) throw new Error(`registerUpload ${initRes.status}`);
  const initData = await initRes.json();
  const uploadUrl = initData?.value?.uploadMechanism?.['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest']?.uploadUrl;
  const assetUrn = initData?.value?.asset;
  if (!uploadUrl || !assetUrn) throw new Error('registerUpload bad format');

  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) throw new Error(`Fetch image ${imgRes.status}`);
  const imgBuffer = await imgRes.arrayBuffer();

  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${LINKEDIN_ACCESS_TOKEN}` },
    body: Buffer.from(imgBuffer),
  });
  if (!uploadRes.ok) throw new Error(`Upload image ${uploadRes.status}`);
  return assetUrn;
}

async function postToLinkedIn(text, articleUrl, articleTitle, articleExcerpt, imageUrl) {
  if (!LINKEDIN_ACCESS_TOKEN || !LINKEDIN_USER_ID) {
    throw new Error('LinkedIn not configured');
  }
  let assetUrn = null;
  if (imageUrl) {
    try { assetUrn = await uploadImageToLinkedIn(imageUrl); } catch (e) { console.error('LI img upload failed:', e); }
  }
  const fullText = assetUrn ? `${text}\n\nCzytaj na: ${articleUrl}` : text;
  const postBody = {
    author: `urn:li:person:${LINKEDIN_USER_ID}`,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: { text: fullText },
        shareMediaCategory: assetUrn ? 'IMAGE' : 'ARTICLE',
        media: [
          assetUrn
            ? { status: 'READY', media: assetUrn, title: { text: articleTitle.slice(0, 200) }, description: { text: (articleExcerpt || '').slice(0, 256) } }
            : { status: 'READY', originalUrl: articleUrl, title: { text: articleTitle.slice(0, 200) }, description: { text: (articleExcerpt || '').slice(0, 256) } },
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
    const err = await liRes.text();
    throw new Error(`LinkedIn ${liRes.status}: ${err.slice(0, 200)}`);
  }
  const data = await liRes.json();
  const postId = data.id || liRes.headers.get('x-restli-id');
  return postId ? `https://www.linkedin.com/feed/update/${encodeURIComponent(postId)}/` : 'https://www.linkedin.com/feed/';
}

function rfc3986(str) {
  return encodeURIComponent(String(str))
    .replace(/!/g, '%21').replace(/\*/g, '%2A').replace(/'/g, '%27')
    .replace(/\(/g, '%28').replace(/\)/g, '%29');
}

function buildTwitterAuthHeader(method, url) {
  const oauthParams = {
    oauth_consumer_key: TWITTER_API_KEY,
    oauth_nonce: crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: TWITTER_ACCESS_TOKEN,
    oauth_version: '1.0',
  };
  const paramString = Object.keys(oauthParams).sort()
    .map(k => `${rfc3986(k)}=${rfc3986(oauthParams[k])}`).join('&');
  const baseString = [method.toUpperCase(), rfc3986(url), rfc3986(paramString)].join('&');
  const signingKey = `${rfc3986(TWITTER_API_SECRET)}&${rfc3986(TWITTER_ACCESS_TOKEN_SECRET)}`;
  const signature = crypto.createHmac('sha1', signingKey).update(baseString).digest('base64');
  oauthParams.oauth_signature = signature;
  return 'OAuth ' + Object.keys(oauthParams).sort()
    .map(k => `${rfc3986(k)}="${rfc3986(oauthParams[k])}"`).join(', ');
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
    '', '',
  ].join('\r\n');
  const footerStr = `\r\n--${boundary}--\r\n`;
  const body = Buffer.concat([Buffer.from(headerStr, 'utf-8'), imgBuffer, Buffer.from(footerStr, 'utf-8')]);
  const authHeader = buildTwitterAuthHeader('POST', uploadUrl);
  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers: { 'Authorization': authHeader, 'Content-Type': `multipart/form-data; boundary=${boundary}` },
    body,
  });
  if (!res.ok) throw new Error(`Twitter media ${res.status}`);
  const data = await res.json();
  return data.media_id_string;
}

function composeTweet(draft, articleUrl) {
  const lines = (draft.linkedinPost || '').split('\n').map(l => l.trim()).filter(Boolean);
  let hook = lines[0] || draft.title;
  const linkedinHashtags = (draft.linkedinPost || '').match(/#\w+/g) || [];
  let tagsLine = '';
  let used = 0;
  for (const tag of linkedinHashtags) {
    if (used + tag.length + 1 > 80) break;
    tagsLine = tagsLine ? `${tagsLine} ${tag}` : tag;
    used += tag.length + 1;
  }
  if (!tagsLine) tagsLine = '#kardiologia #AIinMedicine';
  const URL_BUDGET = 23 + 2;
  const TAGS_BUDGET = tagsLine.length + 2;
  const maxHook = 280 - URL_BUDGET - TAGS_BUDGET;
  if (hook.length > maxHook) {
    hook = hook.slice(0, maxHook - 1).replace(/\s\S*$/, '') + '…';
  }
  return `${hook}\n\n${articleUrl}\n\n${tagsLine}`;
}

async function postToTwitter(tweetText, imageUrl) {
  if (!TWITTER_API_KEY || !TWITTER_API_SECRET || !TWITTER_ACCESS_TOKEN || !TWITTER_ACCESS_TOKEN_SECRET) {
    throw new Error('Twitter not configured');
  }
  let mediaId = null;
  if (imageUrl) {
    try { mediaId = await uploadImageToTwitter(imageUrl); } catch (e) { console.error('TW img upload failed:', e); }
  }
  const url = 'https://api.twitter.com/2/tweets';
  const authHeader = buildTwitterAuthHeader('POST', url);
  const tweetBody = mediaId ? { text: tweetText, media: { media_ids: [mediaId] } } : { text: tweetText };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': authHeader, 'Content-Type': 'application/json', 'User-Agent': 'ai-medycyna-admin' },
    body: JSON.stringify(tweetBody),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Twitter ${res.status}: ${err.slice(0, 200)}`);
  }
  const data = await res.json();
  const tweetId = data?.data?.id;
  return tweetId ? `https://x.com/i/status/${tweetId}` : 'https://x.com';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'POST only' });
  }
  if (!ADMIN_PASSWORD) {
    return res.status(500).json({ ok: false, error: 'ADMIN_PASSWORD not configured' });
  }

  const body = req.body || {};
  const { password, draft, channels } = body;

  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ ok: false, error: 'Niewlasciwe haslo' });
  }
  if (!draft || !draft.title) {
    return res.status(400).json({ ok: false, error: 'Brak draftu albo tytulu' });
  }

  const targetChannels = channels || { website: true, linkedin: true, twitter: true };
  const result = { ok: true };

  // 1. Website
  if (targetChannels.website) {
    try {
      result.website = await publishToWebsite(draft);
    } catch (e) {
      console.error('Website publish error:', e);
      result.websiteError = e.message;
    }
  }

  // 2. LinkedIn
  if (targetChannels.linkedin && draft.linkedinPost) {
    try {
      result.linkedin = await postToLinkedIn(
        draft.linkedinPost,
        result.website || `${SITE_URL}`,
        draft.title,
        draft.excerpt,
        draft.image,
      );
    } catch (e) {
      console.error('LinkedIn publish error:', e);
      result.linkedinError = e.message;
    }
  }

  // 3. Twitter
  if (targetChannels.twitter && draft.linkedinPost) {
    try {
      const tweetText = composeTweet(draft, result.website || `${SITE_URL}`);
      result.twitter = await postToTwitter(tweetText, draft.image);
    } catch (e) {
      console.error('Twitter publish error:', e);
      result.twitterError = e.message;
    }
  }

  // Send confirmation to Telegram (so Radek gets notification)
  if (BOT_TOKEN && ALLOWED_CHAT_ID) {
    try {
      const lines = [`✅ *Opublikowano przez admin*`, `*${draft.title}*`, ''];
      if (result.website) lines.push(`🌐 ${result.website}`);
      if (result.linkedin) lines.push(`💼 ${result.linkedin}`);
      if (result.twitter) lines.push(`✖ ${result.twitter}`);
      if (result.websiteError) lines.push(`⚠️ Strona: ${result.websiteError}`);
      if (result.linkedinError) lines.push(`⚠️ LinkedIn: ${result.linkedinError}`);
      if (result.twitterError) lines.push(`⚠️ X: ${result.twitterError}`);
      await tg('sendMessage', { chat_id: ALLOWED_CHAT_ID, text: lines.join('\n'), parse_mode: 'Markdown' });
    } catch (e) {
      console.error('Telegram notify error:', e);
    }
  }

  return res.status(200).json(result);
}
