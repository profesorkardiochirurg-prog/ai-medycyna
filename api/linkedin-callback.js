const CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;

function escape(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

export default async function handler(req, res) {
  const { code, error, error_description } = req.query;

  if (error) {
    return res.status(400).send(`LinkedIn error: ${error} — ${error_description || ''}`);
  }
  if (!code) {
    return res.status(400).send('Missing code parameter');
  }
  if (!CLIENT_ID || !CLIENT_SECRET) {
    return res.status(500).send('LinkedIn credentials not configured.');
  }

  const host = req.headers.host;
  const redirectUri = `https://${host}/api/linkedin-callback`;

  try {
    const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      return res.status(400).send(`Token exchange failed: ${escape(JSON.stringify(tokenData))}`);
    }

    const userRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userData = await userRes.json();

    const expiresDays = Math.floor((tokenData.expires_in || 0) / 86400);

    const html = `<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="UTF-8">
<title>LinkedIn — autoryzacja zakończona</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; padding: 40px; max-width: 760px; margin: 0 auto; color: #17211f; line-height: 1.6; }
  h1 { color: #0d534c; margin-top: 0; }
  h2 { font-size: 14px; text-transform: uppercase; letter-spacing: 0.06em; color: #62706d; margin-top: 32px; }
  pre { background: #eef5f2; border: 1px solid #dce5e2; padding: 14px 16px; border-radius: 6px; word-break: break-all; white-space: pre-wrap; font-size: 13px; }
  .warn { background: #fff4e6; border: 1px solid #f0c987; padding: 14px 16px; border-radius: 6px; margin: 16px 0; }
  code { background: #eef5f2; padding: 2px 5px; border-radius: 3px; }
</style>
</head>
<body>
  <h1>✅ Autoryzacja LinkedIn powiodła się</h1>
  <p>Zalogowano jako <strong>${escape(userData.name || userData.email || '?')}</strong></p>

  <div class="warn">
    <strong>⚠️ Skopiuj te wartości od razu</strong> — pokazujemy je tylko teraz. Po dodaniu do Vercela ten widok można zamknąć.
  </div>

  <h2>1. Otwórz PowerShell i wklej kolejno (po jednej):</h2>

  <h2>LINKEDIN_ACCESS_TOKEN</h2>
  <pre>${escape(tokenData.access_token)}</pre>
  <p>Wygasa za <strong>${expiresDays} dni</strong>. Po wygaśnięciu — odwiedź ponownie <code>/api/linkedin-auth</code>.</p>

  <h2>LINKEDIN_USER_ID</h2>
  <pre>${escape(userData.sub || '')}</pre>
  <p>Twój URN: <code>urn:li:person:${escape(userData.sub || '')}</code></p>

  ${tokenData.refresh_token ? `
  <h2>LINKEDIN_REFRESH_TOKEN</h2>
  <pre>${escape(tokenData.refresh_token)}</pre>
  <p>Wygasa za ${Math.floor((tokenData.refresh_token_expires_in || 0) / 86400)} dni — pozwala odnawiać access token automatycznie.</p>
  ` : ''}

  <h2>Komendy do PowerShell:</h2>
  <pre>vercel env add LINKEDIN_ACCESS_TOKEN production
vercel env add LINKEDIN_USER_ID production${tokenData.refresh_token ? `
vercel env add LINKEDIN_REFRESH_TOKEN production` : ''}</pre>
  <p>Każda komenda spyta o wartość — wklej odpowiednią z powyższych.</p>

  <hr>
  <p><small>Email: ${escape(userData.email || '—')} · Zarejestrowano: ${new Date().toISOString()}</small></p>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(html);
  } catch (err) {
    res.status(500).send(`Error: ${escape(err.message)}`);
  }
}
