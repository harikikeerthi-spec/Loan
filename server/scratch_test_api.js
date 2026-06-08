const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImhhcmlraWtlZXJ0aGlAZ21haWwuY29tIiwic3ViIjoiMWYzZDNhMzktMzMxYy00YjQxLWJjODEtYzMxMzc2MWUxNzAyIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzY5ODY5MDI5LCJleHAiOjE3Njk5NTU0Mjl9.cA9MU05DlB958Mg8M5a0s-w3p7eCKzbtcjOU711TvMI';

fetch('http://localhost:5000/api/community/posts', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Test Post',
    content: 'This is a test post',
    category: 'General'
  })
}).then(async res => {
  console.log('Status:', res.status);
  const text = await res.text();
  console.log('Body:', text);
}).catch(console.error);
