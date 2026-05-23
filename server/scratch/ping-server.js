const http = require('http');

const req = http.request({
  hostname: 'localhost',
  port: 5000,
  path: '/api/reference/banks', // a public endpoint
  method: 'GET'
}, (res) => {
  console.log('STATUS:', res.statusCode);
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('BODY:', body.substring(0, 200));
    process.exit(0);
  });
});

req.on('error', (e) => {
  console.error('SERVER NOT RUNNING:', e.message);
  process.exit(1);
});

req.end();
