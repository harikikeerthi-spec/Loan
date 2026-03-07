const { Jimp } = require('jimp');
const path = require('path');

async function createFavicon() {
    console.log('Creating perfectly centered square favicon...');
    const imagePath = path.join(__dirname, 'public/images/vidhyaloans-logo-transparent.png');
    const img = await Jimp.read(imagePath);

    // Auto-crop to remove any empty transparent borders
    img.autocrop();

    // Resize it to fit within a 256x256 square, maintaining aspect ratio
    img.scaleToFit({ w: 220, h: 220 });

    // Create a blank 256x256 square transparent image
    const background = new Jimp({ width: 256, height: 256, color: 0x00000000 });

    // Composite the cropped/scaled logo exactly into the center of the 256x256 background
    const x = Math.floor((256 - img.bitmap.width) / 2);
    const y = Math.floor((256 - img.bitmap.height) / 2);

    // Create final favicon by pasting the centered logo onto the clear square background
    background.composite(img, x, y);

    const outPath = path.join(__dirname, 'app/icon.png');
    await background.write(outPath);
    console.log('Saved square centered favicon:', outPath);
}

createFavicon().catch(console.error);
