const admin = require('firebase-admin');
const path = require('path');

// Използваме пътя от .env, гарантирано ще работи във всеки environment
const serviceAccount = require(path.resolve(process.env.FIREBASE_KEY_PATH));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const sendPush = async (fcmToken, title, body, data = {}) => {
  try {
    console.log('👉 SENDING PUSH TO:', fcmToken);

    const message = {
      token: fcmToken,
      notification: {title, body},
      data,
    };

    const response = await admin.messaging().send(message);
    console.log('✅ PUSH SUCCESS:', response);
  } catch (err) {
    console.log('❌ PUSH ERROR:', err);
  }
};

module.exports = {sendPush};
