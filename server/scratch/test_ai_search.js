const http = require('http');

const data = JSON.stringify({
    country: 'USA',
    course: '',
    gpa: 0,
    bachelors: '',
    target_university: ''
});

const options = {
    hostname: '127.0.0.1',
    port: 5001,
    path: '/api/ai/search',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    console.log('Status:', res.statusCode);
    console.log('Headers:', res.headers);
    
    let body = '';
    res.on('data', (chunk) => {
        body += chunk;
    });
    
    res.on('end', () => {
        console.log('Body:', body);
    });
});

req.on('error', (e) => {
    console.error('Error:', e.message);
});

req.write(data);
req.end();
