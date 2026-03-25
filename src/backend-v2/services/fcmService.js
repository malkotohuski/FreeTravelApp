require('dotenv').config();
const admin = require('firebase-admin');

// Абсолютен път до JSON не ти трябва, защото имаш FIREBASE_KEY_JSON в env
const serviceAccount = JSON.parse(process.env.FIREBASE_KEY_JSON);

// 🛠 FIX за новите линии в private_key
serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');

// Инициализация
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const sendPush = async (fcmToken, title, body, data = {}) => {
  try {
    console.log('🔥 TITLE SENT:', title);
    console.log('🔥 BODY SENT:', body);
    console.log('👉 SENDING PUSH TO:', fcmToken);
    console.log('🔥 NEW VERSION WORKING');
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
