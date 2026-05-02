const BOT_TOKEN = process.env.BOT_TOKEN;
const ALLOWED_CHAT_ID = String(process.env.ALLOWED_CHAT_ID || '');

async function tg(method, payload) {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).json({
      ok: true,
      info: 'Telegram webhook endpoint. Awaiting POST from Telegram.',
    });
  }

  if (!BOT_TOKEN || !ALLOWED_CHAT_ID) {
    console.error('Missing env vars: BOT_TOKEN or ALLOWED_CHAT_ID');
    return res.status(200).json({ ok: true });
  }

  try {
    const update = req.body || {};

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
          text: 'Bot uruchomiony.\n\nTu będą trafiać drafty postów do akceptacji. Komendy:\n\n/test — sprawdź czy bot odbiera\n/echo coś — odeśle "coś"',
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
        await tg('sendMessage', {
          chat_id: chatId,
          text: '*Przykładowy draft (mock):*\n\nCzy AI powinno współ-decydować o tym, kto kwalifikuje się do TTVI?\n\nPraca z J Am Soc Echocardiogr (28.04.2026) pokazuje konkretne miejsce dla AI w ocenie pracy prawej komory.\n\n_(W kolejnym kroku tu będą prawdziwe drafty z przyciskami Publikuj/Odrzuć)_',
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[
              { text: '✅ Publikuj', callback_data: 'publish:demo' },
              { text: '❌ Odrzuć', callback_data: 'reject:demo' },
            ]],
          },
        });
      } else if (text) {
        await tg('sendMessage', {
          chat_id: chatId,
          text: `Nie rozumiem komendy. Spróbuj /test, /draft, /echo coś.`,
        });
      }
    }

    if (update.callback_query) {
      const cq = update.callback_query;
      const chatId = String(cq.message.chat.id);

      if (chatId !== ALLOWED_CHAT_ID) {
        return res.status(200).json({ ok: true });
      }

      const data = cq.data || '';
      let response = 'Odebrano';

      if (data.startsWith('publish:')) {
        response = '✅ Zatwierdzone (mock — następna iteracja: realna publikacja na stronie)';
      } else if (data.startsWith('reject:')) {
        response = '❌ Odrzucone';
      }

      await tg('answerCallbackQuery', {
        callback_query_id: cq.id,
        text: response,
      });

      await tg('sendMessage', {
        chat_id: chatId,
        text: response,
      });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Telegram handler error:', err);
    return res.status(200).json({ ok: true });
  }
}
