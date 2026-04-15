require('dotenv').config();
const admin = require('firebase-admin');

if (!process.env.FIREBASE_KEY_JSON) {
  throw new Error('FIREBASE_KEY_JSON is required');
}

const serviceAccount = JSON.parse(process.env.FIREBASE_KEY_JSON);
serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const sendPush = async (fcmToken, title, body, data = {}) => {
  try {
    const message = {
      token: fcmToken,
      notification: {title, body},
      data,
    };

    return await admin.messaging().send(message);
  } catch (err) {
    console.error('Push send failed:', err.message);
    throw err;
  }
};

module.exports = {sendPush};
