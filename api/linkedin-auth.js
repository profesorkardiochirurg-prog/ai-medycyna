const CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;

export default async function handler(req, res) {
  if (!CLIENT_ID) {
    return res.status(500).json({
      ok: false,
      error: 'LINKEDIN_CLIENT_ID not configured on Vercel.',
    });
  }

  const host = req.headers.host;
  const redirectUri = `https://${host}/api/linkedin-callback`;
  const state = Math.random().toString(36).slice(2);
  const scope = 'openid profile email w_member_social';

  const authUrl = new URL('https://www.linkedin.com/oauth/v2/authorization');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('scope', scope);

  res.redirect(302, authUrl.toString());
}
