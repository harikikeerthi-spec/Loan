const assert = require('assert');

// Simulate the regex replacement code from CampaignProcessorService
function injectTracking(html, recipientId) {
  if (!html) return '';

  const backendUrl = 'http://localhost:5000/api';

  // 1. Inject open tracking pixel
  const trackingPixel = `<img src="${backendUrl}/campaigns/track/open/${recipientId}" width="1" height="1" style="display:none;" />`;

  let processedHtml = html;
  if (processedHtml.includes('</body>')) {
    processedHtml = processedHtml.replace('</body>', `${trackingPixel}</body>`);
  } else if (processedHtml.includes('</html>')) {
    processedHtml = processedHtml.replace('</html>', `${trackingPixel}</html>`);
  } else {
    processedHtml = processedHtml + trackingPixel;
  }

  // 2. Wrap links inside <a> tags
  const anchorRegex = /<a\s+([^>]*?)href=(["'])(https?:\/\/[^"'\s>]+)(["'])([^>]*?)>/gi;
  processedHtml = processedHtml.replace(anchorRegex, (match, before, quote1, url, quote2, after) => {
    const trackingUrl = `${backendUrl}/campaigns/track/click/${recipientId}?redirect=${encodeURIComponent(url)}`;
    return `<a ${before}href=${quote1}${trackingUrl}${quote2}${after}>`;
  });

  return processedHtml;
}

// Test cases
const inputHtml = `
<html>
<head><title>Test</title></head>
<body>
  <h1>Welcome {{firstName}}</h1>
  <p>Please click this <a href="https://vidyaloan.com/dashboard" class="btn" style="color:red">link</a> to complete your profile.</p>
  <p>Here is another <a style="font-weight:bold" href="https://example.com/apply">apply link</a>.</p>
</body>
</html>
`;

console.log('Original HTML:\n', inputHtml);
const recipientId = 'test-recipient-1234';
const outputHtml = injectTracking(inputHtml, recipientId);
console.log('\nProcessed HTML:\n', outputHtml);

// Verification assertions
assert(outputHtml.includes('<img src="http://localhost:5000/api/campaigns/track/open/test-recipient-1234"'), 'Missing open pixel!');
assert(outputHtml.includes('href="http://localhost:5000/api/campaigns/track/click/test-recipient-1234?redirect=https%3A%2F%2Fvidyaloan.com%2Fdashboard"'), 'Click link 1 not wrapped correctly!');
assert(outputHtml.includes('href="http://localhost:5000/api/campaigns/track/click/test-recipient-1234?redirect=https%3A%2F%2Fexample.com%2Fapply"'), 'Click link 2 not wrapped correctly!');
assert(outputHtml.includes('class="btn" style="color:red"'), 'Anchor attributes on link 1 got lost!');
assert(outputHtml.includes('style="font-weight:bold"'), 'Anchor attributes on link 2 got lost!');

console.log('\nAll regex verification tests passed successfully!');
