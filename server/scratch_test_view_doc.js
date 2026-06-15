const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImhhcmlraWtlZXJ0aGlAZ21haWwuY29tIiwic3ViIjoiMWYzZDNhMzktMzMxYy00YjQxLWJjODEtYzMxMzc2MWUxNzAyIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzgwMTE1NzczLCJleHAiOjE3ODI3MDc3NzN9.RXJcRJJ0uoUkM2rDRZdDwJBc1_sBVUp0LsaX3wO4mkw';
const appId = 'b1c29ad3-cf35-43ae-95bd-82cb4a639cc0';
const docId = 'vault_VL-STU-2026-00028_marksheet_10_1781364791474';

async function run() {
    const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
    const url = `http://localhost:5000/api/applications/admin/${appId}/documents/${docId}/view?token=${token}`;
    console.log("Calling URL:", url);
    const res = await fetch(url, { redirect: 'manual' });
    console.log("Status:", res.status);
    console.log("Headers:", res.headers.raw());
    if (res.status === 200) {
        console.log("Served a file of length:", res.headers.get('content-length'));
    }
}
run();
