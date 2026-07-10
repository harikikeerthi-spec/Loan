const start = Date.now();
async function run() {
  console.log('Starting fetch test...');
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.log('Timing out request...');
    controller.abort();
  }, 1500);

  try {
    const url = 'https://vidyaloans-s3-bucket.s3.amazonaws.com/documents/VL-STU-2026-00060/passport/1783007686068-WhatsApp_Image_2026-05-19_at_10.20.09_AM__1_.jpeg';
    console.log('Fetching:', url);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    console.log('Response Status:', res.status);
  } catch (err) {
    console.log('Caught expected/unexpected error:', err.message || err);
  }
  console.log('Finished in', (Date.now() - start) / 1000, 'seconds');
}

run().catch(console.error);
