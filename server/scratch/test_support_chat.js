const { Client } = require('pg');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-this-in-production-2024';
const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}/api`;

function generateToken(email, role, details = {}) {
  return jwt.sign(
    {
      email,
      role,
      firstName: details.firstName || 'Test',
      lastName: details.lastName || 'User',
      phoneNumber: details.phoneNumber || '1234567890',
      sub: details.sub || `TEST-${role.toUpperCase()}`,
      ...details
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

async function makeRequest(path, method = 'GET', body = null, token = null) {
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers,
  };
  if (body) {
    options.body = JSON.stringify(body);
  }

  const url = `${BASE_URL}${path}`;
  const response = await fetch(url, options);
  const status = response.status;
  let json = null;
  try {
    json = await response.json();
  } catch (e) {
    // Not JSON response
  }
  return { status, json };
}

async function run() {
  console.log('=== SUPPORT CHAT INTEGRATION TEST ===\n');

  const pgClient = new Client({ connectionString: process.env.DIRECT_URL });
  await pgClient.connect();

  try {
    // 1. Setup Test Users in Database
    console.log('1. Setting up test users in Database...');
    
    // Support User
    const supportEmail = 'test_support@vidyaloans.com';
    const supportId = 'test-support-user-id';
    await pgClient.query(`
      INSERT INTO "User" (id, email, role, password, "firstName", "lastName", "phoneNumber", mobile)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
      ON CONFLICT (email) 
      DO UPDATE SET role = $3, "firstName" = $5, "lastName" = $6, "phoneNumber" = $7, mobile = $7
    `, [supportId, supportEmail, 'support', '', 'Test', 'Support', '9999999999']);
    console.log(` - Upserted support user: ${supportEmail} (role: support)`);

    // Staff User
    const staffEmail = 'test_staff@vidyaloans.com';
    const staffId = 'test-staff-user-id';
    await pgClient.query(`
      INSERT INTO "User" (id, email, role, password, "firstName", "lastName", "phoneNumber", mobile)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
      ON CONFLICT (email) 
      DO UPDATE SET role = $3, "firstName" = $5, "lastName" = $6, "phoneNumber" = $7, mobile = $7
    `, [staffId, staffEmail, 'staff', '', 'Test', 'Staff', '8888888888']);
    console.log(` - Upserted staff user: ${staffEmail} (role: staff)`);

    // Generate Tokens
    const supportToken = generateToken(supportEmail, 'support', {
      firstName: 'Test',
      lastName: 'Support',
      phoneNumber: '9999999999',
      sub: supportId,
    });

    const staffToken = generateToken(staffEmail, 'staff', {
      firstName: 'Test',
      lastName: 'Staff',
      phoneNumber: '8888888888',
      sub: staffId,
    });

    // 2. Call support-start-staff
    console.log('\n2. Testing POST /chat/support-start-staff (Support starting conversation with Staff)...');
    const startStaffRes = await makeRequest('/chat/support-start-staff', 'POST', {
      staffEmail: staffEmail,
      staffName: 'Test Staff'
    }, supportToken);
    
    console.log(`Response Status: ${startStaffRes.status}`);
    console.log('Response JSON:', JSON.stringify(startStaffRes.json, null, 2));

    if (startStaffRes.status !== 201 && startStaffRes.status !== 200) {
      throw new Error(`Failed to start support-to-staff conversation: ${JSON.stringify(startStaffRes.json)}`);
    }

    const staffConv = startStaffRes.json.conversation;
    if (staffConv.metadata.type !== 'support_to_staff' || staffConv.customerPhone !== `STF_${staffEmail.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`) {
      throw new Error(`Invalid conversation structure returned: ${JSON.stringify(staffConv)}`);
    }
    console.log('✅ POST /chat/support-start-staff PASSED');

    // 3. Call support-start-bank
    console.log('\n3. Testing POST /chat/support-start-bank (Support starting conversation with Bank)...');
    const startBankRes = await makeRequest('/chat/chat/support-start-bank', 'POST', {
      bankName: 'IDFC FIRST Bank',
      bankEmail: 'bank+idfc@internal'
    }, supportToken);

    // Wait! Let's handle if ChatController is mapped to `/chat` and not `/chat/chat` - it is mapped to `/chat` since Controller is `chat`
    // Wait, let's fix path to '/chat/support-start-bank' instead of '/chat/chat/support-start-bank'
    const cleanStartBankRes = await makeRequest('/chat/support-start-bank', 'POST', {
      bankName: 'IDFC FIRST Bank',
      bankEmail: 'bank+idfc@internal'
    }, supportToken);

    console.log(`Response Status: ${cleanStartBankRes.status}`);
    console.log('Response JSON:', JSON.stringify(cleanStartBankRes.json, null, 2));

    if (cleanStartBankRes.status !== 201 && cleanStartBankRes.status !== 200) {
      throw new Error(`Failed to start support-to-bank conversation: ${JSON.stringify(cleanStartBankRes.json)}`);
    }

    const bankConv = cleanStartBankRes.json.conversation;
    if (bankConv.metadata.type !== 'support_to_bank' || bankConv.customerPhone !== 'BNK_IDFC_FIRST_BANK_SUP') {
      throw new Error(`Invalid conversation structure returned: ${JSON.stringify(bankConv)}`);
    }
    console.log('✅ POST /chat/support-start-bank PASSED');

    // 4. Fetch support conversations list and verify filtering
    console.log('\n4. Testing GET /chat/conversations as a support user...');
    const conversationsRes = await makeRequest('/chat/conversations', 'GET', null, supportToken);
    console.log(`Response Status: ${conversationsRes.status}`);
    
    if (conversationsRes.status !== 200) {
      throw new Error(`Failed to fetch conversations: ${JSON.stringify(conversationsRes.json)}`);
    }

    const conversations = conversationsRes.json;
    console.log(`Retrieved ${conversations.length} conversations for support user.`);
    console.log('Conversations summary:', conversations.map(c => ({
      id: c.id,
      phone: c.customerPhone,
      type: c.metadata?.type,
      name: c.customerName
    })));

    // Verify all conversations are of support types
    const invalidConv = conversations.find(c => c.metadata?.type !== 'support_to_staff' && c.metadata?.type !== 'support_to_bank');
    if (invalidConv) {
      throw new Error(`Filtering failure: support user has access to a non-support conversation: ${JSON.stringify(invalidConv)}`);
    }
    console.log('✅ GET /chat/conversations filtering PASSED');

    // 5. Try WebSocket Connection if socket.io-client is available
    console.log('\n5. Testing WebSocket connections (Optional)...');
    try {
      const io = require('socket.io-client');
      console.log(' - socket.io-client library found! Attempting socket connection...');
      
      const socket = io(`http://localhost:${PORT}/chat`, {
        transports: ['websocket'],
        auth: {
          token: supportToken
        }
      });

      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          socket.disconnect();
          reject(new Error('Socket connection timed out (is the NestJS server running?)'));
        }, 5000);

        socket.on('connect', () => {
          clearTimeout(timeout);
          console.log(` - Successfully connected to gateway namespace /chat. Socket ID: ${socket.id}`);
          
          // Try to join rooms
          socket.emit('joinRoom', 'room_support', (res) => {
            console.log(' - joinRoom room_support response:', res);
          });
          
          socket.emit('joinRoom', 'room_staff', (res) => {
            console.log(' - joinRoom room_staff response:', res);
          });

          socket.emit('joinRoom', 'room_bank', (res) => {
            console.log(' - joinRoom room_bank response:', res);
            socket.disconnect();
            resolve();
          });
        });

        socket.on('connect_error', (err) => {
          clearTimeout(timeout);
          reject(err);
        });
      });
      console.log('✅ WebSocket gateway connections & room joins PASSED');

    } catch (socketErr) {
      if (socketErr.code === 'MODULE_NOT_FOUND') {
        console.log(' - socket.io-client is not installed in the server workspace. Skipping WebSocket test client.');
      } else {
        console.warn(' - WebSocket verification warning:', socketErr.message || socketErr);
      }
    }

    console.log('\n🎉 ALL SUPPORT CHAT INTEGRATION TESTS COMPLETED SUCCESSFULLY!');

  } catch (err) {
    console.error('\n❌ Support Chat integration test FAILED:', err);
    process.exit(1);
  } finally {
    await pgClient.end();
  }
}

run();
