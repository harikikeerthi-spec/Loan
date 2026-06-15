const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
require('dotenv').config();

async function run() {
    const rawRegion = (process.env.AWS_REGION || 'us-east-1').trim();
    const regionMatch = rawRegion.match(/[a-z]{2}-[a-z]+-\d/i);
    const region = regionMatch ? regionMatch[0].toLowerCase() : 'us-east-1';
    
    const bucket = (process.env.AWS_S3_BUCKET_NAME || '').trim();
    const accessKeyId = (process.env.AWS_ACCESS_KEY_ID || '').trim();
    const secretAccessKey = (process.env.AWS_SECRET_ACCESS_KEY || '').trim();

    const client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: 'documents/VL-STU-2026-00028/marksheet_10/1781364783700-ssc_long_memo.pdf',
    });

    try {
        const url = await getSignedUrl(client, command, { expiresIn: 3600 });
        console.log("Generated URL:", url);
        
        // Fetch the URL
        const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
        const res = await fetch(url);
        console.log("Response status:", res.status);
        console.log("Response headers:", res.headers.raw());
        if (res.status !== 200) {
            const body = await res.text();
            console.log("Response body:", body);
        }
    } catch (err) {
        console.error("Error:", err);
    }
}
run();
