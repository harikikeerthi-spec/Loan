const http = require('http');

function postRequest(path, payload, label) {
    return new Promise((resolve) => {
        const data = JSON.stringify(payload);
        const options = {
            hostname: '127.0.0.1',
            port: 5000,
            path: `/api/ai/${path}`,
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
        };
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', c => body += c);
            res.on('end', () => {
                let p;
                try { p = JSON.parse(body); } catch { p = {}; }
                const status = p.success ? '✅ PASS' : '❌ FAIL';
                console.log(`\n${status} [${label}] → HTTP ${res.statusCode}`);
                if (p.universities !== undefined) console.log(`   universities.length = ${p.universities.length}${p.universities[0] ? ', first.name = ' + (p.universities[0].name || '?') : ''}`);
                if (p.courses !== undefined) console.log(`   courses.length = ${p.courses.length}${p.courses[0] ? ', first.name = ' + (p.courses[0].name || '?') : ''}`);
                if (p.message) console.log(`   message = ${p.message}`);
                resolve(p);
            });
        });
        req.on('error', e => { console.log(`❌ [${label}] Network error: ${e.message}`); resolve(null); });
        req.write(data); req.end();
    });
}

async function run() {
    console.log('=== Final endpoint verification ===\n');

    // Test 1: Indian bachelor's university search (the broken flow)
    await postRequest('search-universities', { query: 'Anna University', degree: "Bachelor's", country: 'India' }, 'Indian Bachelors University');

    // Test 2: Masters international university search 
    await postRequest('search-universities', { query: 'MIT', degree: "Master's", country: 'USA' }, 'Masters International University');

    // Test 3: Course search (the missing endpoint)
    await postRequest('search-courses', { university: 'Anna University', query: 'Computer Science', degree: "Bachelor's" }, 'Course Search');

    // Test 4: Evaluate flow (no country set, should not error)
    await postRequest('search-universities', { query: 'Stanford', degree: "Master's" }, 'Evaluate Flow (no country)');

    console.log('\n=== Done ===');
}
run();
