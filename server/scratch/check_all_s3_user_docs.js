const { createClient } = require('@supabase/supabase-js');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const https = require('https');
const dns = require('dns');

try { dns.setDefaultResultOrder('ipv4first'); } catch (e) {}

const env = {};
fs.readFileSync('./.env', 'utf-8').split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key && key.trim()) {
    let val = values.join('=').trim();
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.substring(1, val.length - 1);
    }
    env[key.trim()] = val;
  }
});

const rawRegion = (env.AWS_REGION || 'us-east-1').trim();
const regionMatch = rawRegion.match(/[a-z]{2}-[a-z]+-\d/i);
const region = regionMatch ? regionMatch[0].toLowerCase() : 'us-east-1';

const s3Client = new S3Client({
  region: region,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

const bucket = env.AWS_S3_BUCKET_NAME;

const normalizeHeaders = (h) => {
  if (!h) return {};
  const obj = {};
  if (typeof h.forEach === 'function') {
    h.forEach((v, k) => { obj[k] = v; });
    return obj;
  }
  return h;
};

const customIPv4Fetch = async (url, options = {}) => {
  const parsed = typeof url === 'string' ? new URL(url) : url;
  return new Promise((resolve, reject) => {
    const headers = normalizeHeaders(options.headers);
    const req = https.request(
      parsed,
      { method: options.method || 'GET', headers, family: 4 },
      (res) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          const body = Buffer.concat(chunks).toString();
          const headerObj = {};
          for (const [k, v] of Object.entries(res.headers)) {
            if (v) headerObj[k] = Array.isArray(v) ? v.join(', ') : v;
          }
          resolve(new Response(body, { status: res.statusCode || 200, statusText: res.statusMessage, headers: headerObj }));
        });
      },
    );
    req.on('error', (err) => reject(err));
    if (options.body) req.write(options.body);
    req.end();
  });
};

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, { global: { fetch: customIPv4Fetch } });

async function checkAllUserDocs() {
  const userId = 'VL-STU-2026-00039';
  console.log(`Checking DB and S3 status for user: ${userId}...`);

  const { data: docs, error } = await supabase
    .from('UserDocument')
    .select('*')
    .eq('userId', userId);

  if (error) {
    console.error('Error fetching DB docs:', error);
    return;
  }

  console.log(`Found ${docs.length} document records in DB:`);

  for (const doc of docs) {
    console.log(`\n📄 DocType: "${doc.docType}" | FilePath in DB: "${doc.filePath}"`);
    if (!doc.filePath) {
      console.log('   ❌ Missing filePath in DB');
      continue;
    }

    try {
      const getCmd = new GetObjectCommand({ Bucket: bucket, Key: doc.filePath });
      const res = await s3Client.send(getCmd);
      console.log(`   ✅ S3 EXISTS: ContentLength=${res.ContentLength}, ContentType=${res.ContentType}`);
    } catch (err) {
      console.log(`   ❌ S3 NOT FOUND: key "${doc.filePath}" does not exist in S3 bucket (${err.message})`);
    }
  }
}

checkAllUserDocs();
