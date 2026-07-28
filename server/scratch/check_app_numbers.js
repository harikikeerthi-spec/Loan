const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const dns = require('dns');

try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {}

const SUPABASE_URL = 'https://mhhmqdbzsmwyizmvwtsx.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oaG1xZGJ6c213eWl6bXZ3dHN4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzAzMDQ2OCwiZXhwIjoyMDg4NjA2NDY4fQ.ySrjelBYD9uK22tfPMZHSojDNkgzeaR9by-ChtXe0aY';

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
          resolve(
            new Response(body, {
              status: statusCode,
              statusText: res.statusMessage,
              headers: headerObj,
            }),
          );
        });
      },
    );
    req.on('error', (err) => reject(err));
    if (options.body) req.write(options.body);
    req.end();
  });
};

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  global: { fetch: customIPv4Fetch }
});

async function checkAppNumbers() {
  const { data, error } = await supabase
    .from('LoanApplication')
    .select('id, applicationNumber, firstName, lastName, status, bank, submittedAt, date')
    .order('date', { ascending: false });

  if (error) {
    console.error("Error fetching applications:", error);
    return;
  }

  console.log(`Total applications: ${data.length}`);
  data.slice(0, 35).forEach(app => {
    console.log(`ID: ${app.id} | AppNum: ${app.applicationNumber} | Name: ${app.firstName} ${app.lastName} | Status: ${app.status}`);
  });
}

checkAppNumbers();
