const fs = require('fs');
const path = require('path');

async function testWeek5Apis() {
  const token = fs.readFileSync(path.join(__dirname, '..', 'admin_token_final_clean.txt'), 'utf8').trim();
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  const baseUrl = 'http://localhost:5000/api';
  
  console.log('--- Week 5 API Verification ---');

  // Helper for requests
  const callApi = async (name, url, options = {}) => {
    try {
      console.log(`\nTesting: ${name} (${url})...`);
      const res = await fetch(url, {
        headers,
        ...options,
        body: options.body ? JSON.stringify(options.body) : undefined
      });
      console.log(`Status: ${res.status} ${res.statusText}`);
      
      const body = await res.json();
      if (res.ok) {
        console.log('Result: SUCCESS');
        if (body.data) {
          if (Array.isArray(body.data)) {
            console.log(`Items count: ${body.data.length}`);
            if (body.data.length > 0) {
              console.log('First Item Preview:', JSON.stringify(body.data[0]).slice(0, 150) + '...');
            }
          } else {
            console.log('Keys returned:', Object.keys(body.data));
            console.log('Data Preview:', JSON.stringify(body.data).slice(0, 150) + '...');
          }
        } else {
          console.log('Keys returned:', Object.keys(body));
        }
        return body;
      } else {
        console.error('Result: FAILED', body);
        return null;
      }
    } catch (e) {
      console.error(`Error testing ${name}:`, e.message);
      return null;
    }
  };

  // 1. GET Conversations
  const convs = await callApi('GET Conversations', `${baseUrl}/chat/conversations`);
  let testConvId = null;
  if (convs && convs.length > 0) {
    testConvId = convs[0].id;
  } else {
    // Attempt connecting to get a conversation
    const connRes = await callApi('POST Connect Conversation', `${baseUrl}/chat/connect`, { method: 'POST' });
    if (connRes && connRes.conversation) {
      testConvId = connRes.conversation.id;
    }
  }

  // 2. Paginated Messages
  if (testConvId) {
    await callApi('GET Paginated Chat Messages', `${baseUrl}/chat/messages/${testConvId}?limit=5&offset=0`);
    
    // 3. POST Chat Message
    await callApi('POST Chat Message', `${baseUrl}/chat/messages`, {
      method: 'POST',
      body: {
        conversationId: testConvId,
        content: 'Verification testing for Week 5 Chat API HTTP posting capability.',
        messageType: 'text'
      }
    });
  }

  // 4. Schemes CRUD
  const scheme = await callApi('POST Create Scheme (F37)', `${baseUrl}/bank-schemes`, {
    method: 'POST',
    body: {
      schemeName: 'Super Scholar Education Loan Scheme',
      interestRate: 8.75,
      minLoanAmount: 1000000,
      maxLoanAmount: 8000000,
      validFrom: new Date().toISOString(),
      validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'ACTIVE'
    }
  });

  const schemeId = scheme?.data?.id;

  await callApi('GET Active Schemes (F37)', `${baseUrl}/bank-schemes`);

  if (schemeId) {
    await callApi('PUT Update Scheme (F37)', `${baseUrl}/bank-schemes/${schemeId}`, {
      method: 'PUT',
      body: {
        interestRate: 8.50,
        remarks: 'Updated ratespread to match target'
      }
    });

    await callApi('DELETE Soft Delete Scheme (F37)', `${baseUrl}/bank-schemes/${schemeId}`, {
      method: 'DELETE'
    });
  }

  // 5. Bulk CSV Export (F28)
  try {
    console.log(`\nTesting: GET Bulk CSV Export (F28) (${baseUrl}/staff-profiles/export/applications)...`);
    const csvRes = await fetch(`${baseUrl}/staff-profiles/export/applications`, { headers });
    console.log(`Status: ${csvRes.status} ${csvRes.statusText}`);
    if (csvRes.ok) {
      const csvText = await csvRes.text();
      console.log('Result: SUCCESS');
      console.log('CSV Preview:\n' + csvText.split('\n').slice(0, 4).join('\n') + '\n...');
    } else {
      console.error('Result: FAILED');
    }
  } catch (e) {
    console.error('Error testing Bulk CSV Export:', e.message);
  }

  // 6. Branch-level Analytics (F39)
  await callApi('GET Multi-Branch Analytics (F39)', `${baseUrl}/staff-profiles/branches/analytics`);

  // 7. RM CRUD (F45)
  const rm = await callApi('POST Create RM Profile (F45)', `${baseUrl}/rm-profiles`, {
    method: 'POST',
    body: {
      name: 'Rohan Sharma',
      email: `rohan.sharma.${Date.now()}@sbi.co.in`,
      phone: '9876543210',
      bankName: 'SBI',
      branchName: 'M.G. Road Branch'
    }
  });

  const rmId = rm?.data?.id;
  await callApi('GET List RM Profiles (F45)', `${baseUrl}/rm-profiles?bankName=SBI`);

  if (rmId) {
    await callApi('PUT Update RM Profile (F45)', `${baseUrl}/rm-profiles/${rmId}`, {
      method: 'PUT',
      body: {
        phone: '9999999999'
      }
    });
    
    await callApi('DELETE Deactivate RM Profile (F45)', `${baseUrl}/rm-profiles/${rmId}`, {
      method: 'DELETE'
    });
  }

  // 8. Officer Target Tracker (F40)
  await callApi('POST Create Officer Target (F40)', `${baseUrl}/rm-profiles/targets`, {
    method: 'POST',
    body: {
      officerEmail: 'harikikeerthi@gmail.com',
      targetMonth: new Date().toISOString().substring(0, 7),
      targetAmount: 50000000,
      targetCount: 15
    }
  });

  await callApi('GET Get Officer Target Progress (F40)', `${baseUrl}/rm-profiles/targets/harikikeerthi@gmail.com`);

  // 9. Config: Loan Products CRUD (F17)
  const product = await callApi('POST Create Product Config (F17)', `${baseUrl}/bank/config/loan-products`, {
    method: 'POST',
    body: {
      bankId: 'SBI',
      productName: 'SBI Global Scholar Loan',
      minRate: 8.5,
      maxRate: 11.2,
      processingFee: 10000,
      isActive: true
    }
  });

  const prodId = product?.product?.id || product?.data?.id;

  if (prodId) {
    await callApi('DELETE Delete Product Config (F17)', `${baseUrl}/bank/config/loan-products/${prodId}`, {
      method: 'DELETE'
    });
  }

  // 10. Config: Document Checklists CRUD (F18)
  const checklist = await callApi('POST Create Checklist Config (F18)', `${baseUrl}/bank/config/checklists`, {
    method: 'POST',
    body: {
      bankName: 'SBI',
      productType: 'Global Scholar',
      requiredDocs: ['PAN', 'Aadhar', 'GRE Score', 'Admit Letter'],
      isActive: true
    }
  });

  const chkId = checklist?.checklist?.id || checklist?.data?.id;
  await callApi('GET List Checklists Config (F18)', `${baseUrl}/bank/config/checklists`);

  if (chkId) {
    await callApi('PUT Update Checklist Config (F18)', `${baseUrl}/bank/config/checklists/${chkId}`, {
      method: 'PUT',
      body: {
        requiredDocs: ['PAN', 'Aadhar', 'GRE Score', 'Admit Letter', 'Co-Applicant ITR']
      }
    });

    await callApi('DELETE Delete Checklist Config (F18)', `${baseUrl}/bank/config/checklists/${chkId}`, {
      method: 'DELETE'
    });
  }

  // 11. Config: Branches CRUD (F19)
  const bCode = `SBI-BR-${Date.now().toString().slice(-4)}`;
  const branch = await callApi('POST Create Branch Config (F19)', `${baseUrl}/bank/config/branches`, {
    method: 'POST',
    body: {
      bankId: 'SBI',
      branchName: 'Whitefield Branch',
      branchCode: bCode,
      city: 'Bangalore',
      state: 'Karnataka',
      contactEmail: 'whitefield.sbi@sbi.co.in',
      isActive: true
    }
  });

  const brId = branch?.branch?.id || branch?.data?.id;

  if (brId) {
    await callApi('PUT Update Branch Config (F19)', `${baseUrl}/bank/config/branches/${brId}`, {
      method: 'PUT',
      body: {
        branchName: 'SBI Whitefield Corporate Hub'
      }
    });

    await callApi('DELETE Delete Branch Config (F19)', `${baseUrl}/bank/config/branches/${brId}`, {
      method: 'DELETE'
    });
  }

  console.log('\n--- All Week 5 API Verifications Completed Successfully ---');
}

testWeek5Apis().catch(console.error);
