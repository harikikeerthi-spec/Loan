const { Jimp } = require('jimp');
const path = require('path');

async function processLogo() {
    const imagePath = path.join(__dirname, 'public/images/vidhyaloans-logo.jpeg');

    // Create normal transparent logo (for Navbar)
    console.log('Processing normal logo...');
    const img1 = await Jimp.read(imagePath);

    // Make it a bit larger/sharper maybe by trimming out the white edges?
    img1.scan(0, 0, img1.bitmap.width, img1.bitmap.height, function (x, y, idx) {
        const r = this.bitmap.data[idx];
        const g = this.bitmap.data[idx + 1];
        const b = this.bitmap.data[idx + 2];

        // If pixel is near-white (JPEG compression artifacts), make it fully transparent
        if (r > 230 && g > 230 && b > 230) {
            this.bitmap.data[idx + 3] = 0; // Alpha
        } else {
            // Enhance the remaining colors (optional, but ensures they are full-opacity)
            this.bitmap.data[idx + 3] = 255;
        }
    });

    const outPath1 = path.join(__dirname, 'public/images/vidhyaloans-logo-transparent.png');
    await img1.write(outPath1);
    console.log('Saved:', outPath1);

    // Create solid white logo (for Footer)
    console.log('Processing white logo...');
    const img2 = await Jimp.read(imagePath);
    img2.scan(0, 0, img2.bitmap.width, img2.bitmap.height, function (x, y, idx) {
        const r = this.bitmap.data[idx];
        const g = this.bitmap.data[idx + 1];
        const b = this.bitmap.data[idx + 2];

        // If pixel is near-white, make it transparent
        if (r > 230 && g > 230 && b > 230) {
            this.bitmap.data[idx + 3] = 0; // Alpha
        } else {
            // If it's part of the logo mark, make it SOLID WHITE
            // We can preserve anti-aliasing based on how close it is to white
            this.bitmap.data[idx] = 255;
            this.bitmap.data[idx + 1] = 255;
            this.bitmap.data[idx + 2] = 255;
            this.bitmap.data[idx + 3] = 255;
        }
    });

    const outPath2 = path.join(__dirname, 'public/images/vidhyaloans-logo-white.png');
    await img2.write(outPath2);
    console.log('Saved:', outPath2);
}

processLogo().catch(console.error);
