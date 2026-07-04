async function checkApi() {
  try {
    const res = await fetch('http://localhost:5000/api/auth/firebase', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken: 'some-dummy-token' }),
    });
    
    const text = await res.text();
    console.log('Status Code:', res.status);
    console.log('Response Body:', text);
  } catch (err) {
    console.error('Error fetching API:', err);
  }
}

checkApi();
