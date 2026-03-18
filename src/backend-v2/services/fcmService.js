require('dotenv').config();
const admin = require('firebase-admin');
const path = require('path');

// Абсолютен път до JSON
const serviceAccount = JSON.parse(process.env.FIREBASE_KEY_JSON);

// Инициализация
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(require(serviceAccount)),
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
