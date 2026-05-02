const BOT_TOKEN = process.env.BOT_TOKEN;
const ALLOWED_CHAT_ID = String(process.env.ALLOWED_CHAT_ID || '');
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
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
    image: 'https://image.pollinations.ai/prompt/professional%20medical%20illustration%20deep%20learning%20neural%20network%20analyzing%20cardiac%20MRI%20scan%2C%20teal%20and%20mint%20color%20palette%2C%20clean%20editorial%20style%2C%20no%20text%2C%20no%20labels?width=1200&height=600&model=flux&nologo=true&seed=2602',
    imageAlt: 'Ilustracja: sieć neuronowa analizująca obraz rezonansu magnetycznego serca',
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

function buildArticleHtml(draft) {
  const tags = draft.tags.map(t => `<span class="tag">${escape(t)}</span>`).join('\n      ');
  const paras = draft.bodyParagraphs.map(p => `<p>${escape(p)}</p>`).join('\n    ');
  const dateFormatted = formatDate(draft.date);
  const heroImage = draft.image
    ? `<figure class="hero-image">
    <img src="${escape(draft.image)}" alt="${escape(draft.imageAlt || draft.title)}" loading="eager">
  </figure>`
    : '';

  return `<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escape(draft.title)} | dr Radosław Litwinowicz</title>
<meta name="description" content="${escape(draft.excerpt)}">
<link rel="stylesheet" href="../assets/styles.css">
</head>
<body>

<header class="site-header">
  <div class="wrap">
    <div class="brand">
      <strong>dr Radosław Litwinowicz</strong>
      <span>kardiochirurg</span>
    </div>
    <nav class="topnav">
      <a href="../index.html#artykuly">Artykuły</a>
      <a href="../index.html#o-mnie">O mnie</a>
      <a href="https://www.linkedin.com/in/rados%C5%82aw-litwinowicz-0b57b8262" target="_blank" rel="noopener">LinkedIn</a>
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
    <p>© 2026 Radosław Litwinowicz · <a href="https://www.linkedin.com/in/rados%C5%82aw-litwinowicz-0b57b8262" target="_blank" rel="noopener">LinkedIn</a></p>
  </div>
</footer>

</body>
</html>
`;
}

async function publishDraft(draftId) {
  const draft = DEMO_DRAFTS[draftId];
  if (!draft) throw new Error(`Unknown draft: ${draftId}`);

  const ts = Date.now().toString(36);
  const slug = `${draft.date}-${draftId}-${ts}`;
  const articlePath = `articles/${slug}.html`;
  const html = buildArticleHtml(draft);

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
          const url = await publishDraft(draftId);
          const draft = DEMO_DRAFTS[draftId];

          await tg('sendMessage', {
            chat_id: chatId,
            text: `✅ *Opublikowano na stronie*\n\n${url}\n\n_Vercel deployuje ~30 sek._`,
            parse_mode: 'Markdown',
          });

          if (draft && draft.linkedinPost) {
            await tg('sendMessage', {
              chat_id: chatId,
              text: '📋 *Wersja LinkedIn — skopiuj i wklej:*',
              parse_mode: 'Markdown',
            });
            await tg('sendMessage', {
              chat_id: chatId,
              text: draft.linkedinPost,
            });
          }
        } catch (err) {
          console.error('Publish error:', err);
          await tg('sendMessage', {
            chat_id: chatId,
            text: `❌ Błąd publikacji: ${err.message}`,
          });
        }
      } else if (action === 'reject') {
        await tg('sendMessage', {
          chat_id: chatId,
          text: '❌ Odrzucone — draft nie zostanie opublikowany.',
        });
      }
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Telegram handler error:', err);
    return res.status(200).json({ ok: true });
  }
}
