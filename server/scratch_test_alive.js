const http = require('http');

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImhhcmlraWtlZXJ0aGlAZ21haWwuY29tIiwic3ViIjoiMWYzZDNhMzktMzMxYy00YjQxLWJjODEtYzMxMzc2MWUxNzAyIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzY5ODY5MDI5LCJleHAiOjE3Njk5NTU0Mjl9.cA9MU05DlB958Mg8M5a0s-w3p7eCKzbtcjOU711TvMI";

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/chat/conversations',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + token
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  res.setEncoding('utf8');
  res.on('data', (chunk) => {
    console.log(`BODY: ${chunk.substring(0, 100)}...`);
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.end();
