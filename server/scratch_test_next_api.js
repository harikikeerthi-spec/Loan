const http = require('http');

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImhhcmlraWtlZXJ0aGlAZ21haWwuY29tIiwic3ViIjoiMWYzZDNhMzktMzMxYy00YjQxLWJjODEtYzMxMzc2MWUxNzAyIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzY5ODY5MDI5LCJleHAiOjE3Njk5NTU0Mjl9.cA9MU05DlB958Mg8M5a0s-w3p7eCKzbtcjOU711TvMI";

const data = JSON.stringify({
  content: "Test edited content"
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/chat/messages/a62f8c3d-f410-45b7-b885-6ecdb8587c8d',
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
    'Authorization': 'Bearer ' + token
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
  res.setEncoding('utf8');
  res.on('data', (chunk) => {
    console.log(`BODY: ${chunk}`);
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
