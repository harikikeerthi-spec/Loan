const dotenv = require('dotenv');
const path = require('path');
const admin = require('firebase-admin');

// Load .env
dotenv.config({ path: path.join(__dirname, '../.env') });

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

console.log('--- Firebase credentials ---');
console.log('Project ID:', projectId);
console.log('Client Email:', clientEmail);
console.log('Private Key length:', privateKey ? privateKey.length : 0);

if (privateKey) {
  console.log('First 30 chars of private key:', privateKey.substring(0, 30));
  console.log('Last 30 chars of private key:', privateKey.substring(privateKey.length - 30));
  
  // Format private key
  const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');
  console.log('Formatted Private Key length:', formattedPrivateKey.length);
  
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: formattedPrivateKey,
      }),
    });
    console.log('Firebase Admin initialized successfully in diagnostic script!');
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error.message);
  }
} else {
  console.log('No private key found!');
}
