const dns = require('dns');
const https = require('https');
const { createClient } = require('@supabase/supabase-js');
const { Client } = require('pg');
require('dotenv').config();

try { dns.setDefaultResultOrder('ipv4first'); } catch (e) {}

const normalizeHeaders = (h) => {
  if (!h) return {};
  const obj = {};
  if (typeof h.forEach === 'function') {
    h.forEach((v, k) => { obj[k] = v; });
    return obj;
  }
  return h;
};

// High-performance IPv4 HTTPS fetch wrapper for Supabase REST API
const customIPv4Fetch = async (url, options = {}) => {
  const parsed = typeof url === 'string' ? new URL(url) : url;
  return new Promise((resolve, reject) => {
    const headers = normalizeHeaders(options.headers);
    const req = https.request(
      parsed,
      {
        method: options.method || 'GET',
        headers,
        family: 4, // Explicitly force IPv4 socket connection
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
    req.on('error', (err) => reject(err));
    if (options.body) req.write(options.body);
    req.end();
  });
};

const ALLOWED_ROLES = ['admin', 'user', 'staff', 'super_admin', 'agent', 'bank', 'student'];

async function getDbDriver() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    console.log('[Connection] Using Supabase REST API (IPv4 HTTPS)...');
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
      global: { fetch: customIPv4Fetch },
    });

    return {
      type: 'supabase',
      async getUsers() {
        const { data, error } = await supabase
          .from('User')
          .select('id, email, role, firstName, lastName')
          .order('createdAt', { ascending: false })
          .limit(50);
        if (error) throw error;
        return data || [];
      },
      async getUserByEmail(email) {
        const { data, error } = await supabase
          .from('User')
          .select('*')
          .ilike('email', email)
          .maybeSingle();
        if (error) throw error;
        return data;
      },
      async updateUserRole(email, role) {
        const { data, error } = await supabase
          .from('User')
          .update({ role })
          .ilike('email', email)
          .select('id, email, role, firstName, lastName');
        if (error) throw error;
        return data;
      },
      async close() {}
    };
  }

  console.log('[Connection] Falling back to Direct Postgres PG client (IPv4 preference)...');
  const client = new Client({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });
  await client.connect();

  return {
    type: 'pg',
    async getUsers() {
      const res = await client.query('SELECT id, email, role, "firstName", "lastName" FROM "User" ORDER BY "createdAt" DESC LIMIT 50');
      return res.rows;
    },
    async getUserByEmail(email) {
      const res = await client.query('SELECT * FROM "User" WHERE LOWER(email) = $1', [email]);
      return res.rows[0] || null;
    },
    async updateUserRole(email, role) {
      await client.query('UPDATE "User" SET role = $1 WHERE LOWER(email) = $2', [role, email]);
      const res = await client.query('SELECT id, email, role, "firstName", "lastName" FROM "User" WHERE LOWER(email) = $1', [email]);
      return res.rows;
    },
    async close() {
      await client.end();
    }
  };
}

async function main() {
  const args = process.argv.slice(2);
  let db;

  try {
    db = await getDbDriver();

    if (args.length < 2) {
      console.log('\n=== CURRENT USERS IN DATABASE ===');
      const rows = await db.getUsers();

      if (rows.length === 0) {
        console.log('No users found in the database. Please sign up an account first!');
      } else {
        console.table(rows.map(u => ({
          ID: u.id,
          Email: u.email,
          Name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'N/A',
          Role: u.role,
        })));
      }

      console.log('\n=== USAGE INSTRUCTIONS ===');
      console.log('To promote/change a user\'s role, run:');
      console.log('  node scratch/promote-user.js <email> <role>');
      console.log('\nExamples:');
      console.log('  node scratch/promote-user.js myemail@gmail.com admin');
      console.log('  node scratch/promote-user.js myemail@gmail.com staff');
      console.log('  node scratch/promote-user.js myemail@gmail.com bank');
      console.log(`\nAllowed roles: ${ALLOWED_ROLES.join(', ')}`);
      return;
    }

    const email = args[0].trim().toLowerCase();
    const role = args[1].trim().toLowerCase();

    if (!ALLOWED_ROLES.includes(role)) {
      console.error(`\nError: Invalid role "${role}". Allowed roles are: ${ALLOWED_ROLES.join(', ')}`);
      return;
    }

    console.log(`\nSearching for user with email: ${email}...`);
    const user = await db.getUserByEmail(email);

    if (!user) {
      console.error(`Error: User with email "${email}" not found! Please register/signup via the website first.`);
      return;
    }

    console.log(`Found user: ${user.firstName || ''} ${user.lastName || ''} (${user.email}) - Current Role: ${user.role}`);
    console.log(`Updating role to "${role}"...`);

    const updated = await db.updateUserRole(email, role);

    console.log(`\nSuccess! User ${email} has been updated to "${role}".`);
    console.table(updated);

  } catch (e) {
    console.error('An error occurred:', e.message || e);
  } finally {
    if (db) await db.close();
  }
}

main();
