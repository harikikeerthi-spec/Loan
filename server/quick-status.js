const { Client } = require('pg');
require('dotenv').config();

async function quickCheck() {
  const client = new Client({
    connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
  });
  
  try {
    await client.connect();
    const { rows } = await client.query('SELECT COUNT(*) as total, COUNT(CASE WHEN id LIKE \'VL-STU-2026-%\' THEN 1 END) as sequential FROM "User"');
    const total = parseInt(rows[0].total);
    const sequential = parseInt(rows[0].sequential);
    
    console.log('Total users:', total);
    console.log('Sequential format:', sequential);
    console.log('Status:', sequential === total ? '✅ COMPLETE' : '⚠️ INCOMPLETE - ' + sequential + '/' + total);
  } finally {
    await client.end();
  }
}

quickCheck();
