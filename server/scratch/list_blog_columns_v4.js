const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
const https = require('https');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

const normalizeHeaders = (h) => {
  if (!h) return {};
  const obj = {};
  if (typeof h.forEach === 'function') {
    h.forEach((v, k) => {
      obj[k] = v;
    });
    return obj;
  }
  return h;
};

const customIPv4Fetch = async (url, options = {}) => {
  const parsed = new URL(url);
  return new Promise((resolve, reject) => {
    const headers = normalizeHeaders(options.headers);
    const req = https.request(
      parsed,
      {
        method: options.method || 'GET',
        headers,
        family: 4,
      },
      (res) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          const body = Buffer.concat(chunks).toString();
          const headerObj = {};
          for (const [k, v] of Object.entries(res.headers)) {
            if (v) headerObj[k] = Array.isArray(v) ? v.join(', ') : v;
          }
          const statusCode = res.statusCode || 200;
          const nullBodyStatuses = [204, 205, 304];
          const responseBody = nullBodyStatuses.includes(statusCode) ? null : body;
          resolve(
            new Response(responseBody, {
              status: statusCode,
              statusText: res.statusMessage,
              headers: headerObj,
            }),
          );
        });
      },
    );
    req.on('error', (err) => {
      console.error('[SupabaseIPv4Fetch] Request error:', err);
      reject(err);
    });
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
};

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
  global: { fetch: customIPv4Fetch },
});

async function main() {
  const { data, error } = await supabase.from('Blog').select('*').limit(1);
  if (error) {
    console.error('Error fetching blog:', error);
  } else {
    console.log('Blog columns:', data ? Object.keys(data[0] || {}) : 'No data');
    console.log('Blog record:', data);
  }
}

main();
