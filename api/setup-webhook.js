const BOT_TOKEN = process.env.BOT_TOKEN;

export default async function handler(req, res) {
  if (!BOT_TOKEN) {
    return res.status(500).json({
      ok: false,
      error: 'BOT_TOKEN env var not set on Vercel. Add it in Project Settings → Environment Variables.',
    });
  }

  const host = req.headers.host;
  const webhookUrl = `https://${host}/api/telegram`;

  try {
    const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ['message', 'callback_query'],
      }),
    });

    const data = await tgRes.json();

    return res.status(200).json({
      ok: data.ok === true,
      webhookSetTo: webhookUrl,
      telegramResponse: data,
      next: data.ok
        ? 'Otwórz Telegram i wyślij /test do bota — powinien odpowiedzieć.'
        : 'Webhook nie został ustawiony. Sprawdź telegramResponse.description.',
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err.message,
    });
  }
}
