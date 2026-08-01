const http = require('http');

function makeRequest(path, method = 'GET', payload = null) {
  return new Promise((resolve, reject) => {
    const data = payload ? JSON.stringify(payload) : '';
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    if (payload) {
      options.headers['Content-Length'] = Buffer.byteLength(data);
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (e) => reject(e));
    if (payload) req.write(data);
    req.end();
  });
}

async function runVerification() {
  console.log('--- RUNNING USER UPDATE FIX VERIFICATION ON EXISTING USERS ---');

  // Fetch recent applications to get a valid existing user email & ID
  try {
    const appsRes = await makeRequest('/api/applications/admin/all?limit=5');
    let testEmail = 'student@example.com';
    let testUserId = null;

    if (appsRes.data && appsRes.data.applications && appsRes.data.applications.length > 0) {
      const app = appsRes.data.applications[0];
      testEmail = app.email || app.user?.email || testEmail;
      testUserId = app.userId || app.user?.id;
    }

    console.log(`Found existing candidate in DB -> email: ${testEmail}, userId: ${testUserId}`);

    const testPayload = {
      userId: testUserId,
      email: testEmail,
      firstName: 'UpdatedFirst',
      lastName: 'UpdatedLast',
      phoneNumber: '9876543210',
      dateOfBirth: '1999-08-15',
      targetUniversity: 'Oxford University',
      studyDestination: 'United Kingdom',
      fatherName: 'Father Test Name',
      motherName: 'Mother Test Name',
      family: {
        fatherAadhar: '111122223333',
        fatherPan: 'FATHR1234X',
        motherAadhar: '444455556666',
        motherPan: 'MTHRR5678Y',
      },
      coApplicant: {
        name: 'CoApp Test Name',
        relation: 'Father',
        monthlyIncome: '150000',
        aadharNumber: '777788889999',
        panNumber: 'COAPP9999Z',
      },
      academic: {
        ssc: { institute: 'Delhi Public School', percentage: '95.0' },
        hsc: { institute: 'St. Stephens College', percentage: '93.2' },
        ug: { institute: 'IIT Delhi', percentage: '9.1 CGPA' },
        bachelorsDegree: 'Computer Engineering',
        gpa: 3.9,
        workExp: 3,
      },
    };

    console.log('\nTesting POST /api/users/admin/update-details on existing user...');
    const res = await makeRequest('/api/users/admin/update-details', 'POST', testPayload);
    console.log('Response Status:', res.statusCode);
    console.log('Response Data:', JSON.stringify(res.data, null, 2));

    if (res.data && res.data.success && res.data.user && res.data.user.id) {
      console.log('🎉 SUCCESS: User details updated without PGRST204 errors!');
      console.log('Updated user ID:', res.data.user.id);
      console.log('Target University:', res.data.user.targetUniversity);
      console.log('Study Destination:', res.data.user.studyDestination);
      console.log('Father Name:', res.data.user.family?.fatherName || res.data.user.fatherName);
      console.log('Academic Data:', res.data.user.academic);
    } else {
      console.error('❌ Failed update response:', res.data);
    }
  } catch (err) {
    console.error('Verification error:', err.message);
  }
}

runVerification();
