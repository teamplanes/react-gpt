/* eslint-disable no-restricted-syntax */
const pickHeaders = (headers: Headers, keys: (string | RegExp)[]): Headers => {
  const picked = new Headers();
  for (const key of headers.keys()) {
    if (keys.some((k) => (typeof k === 'string' ? k === key : k.test(key)))) {
      const value = headers.get(key);
      if (typeof value === 'string') {
        picked.set(key, value);
      }
    }
  }
  return picked;
};

const CORS_HEADERS: Record<string, string> = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'access-control-allow-headers': 'Content-Type',
};

async function handleRequest(req: Request & {nextUrl?: URL}) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: CORS_HEADERS,
    });
  }

  const {pathname, search} = req.nextUrl ? req.nextUrl : new URL(req.url);
  const url = new URL(
    pathname.replace('/openai', '/v1') + search,
    'https://api.openai.com',
  ).href;
  const headers = pickHeaders(req.headers, ['content-type']);
  headers.set('authorization', `Bearer ${process.env.OPENAI_API_KEY}`);

  const res = await fetch(url, {
    body: req.body,
    method: req.method,
    headers,
  });

  const resHeaders = {
    ...CORS_HEADERS,
    ...Object.fromEntries(
      pickHeaders(res.headers, ['content-type', /^x-ratelimit-/, /^openai-/]),
    ),
  };

  return new Response(res.body, {
    headers: resHeaders,
  });
}

export const config = {
  runtime: 'edge',
};

export default handleRequest;
