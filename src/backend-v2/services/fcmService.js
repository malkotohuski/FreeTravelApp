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

const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();

const sendPush = async (fcmToken, title, body, data = {}) => {
  try {
    console.log('🔥 TITLE SENT:', title);
    console.log('🔥 BODY SENT:', body);
    console.log('👉 SENDING PUSH TO:', fcmToken);

    const message = {
      token: fcmToken,
      notification: {title, body},
      data,
      android: {
        priority: 'high',
        notification: {
          clickAction: 'FLUTTER_NOTIFICATION_CLICK',
        },
      },
    };

    const response = await admin.messaging().send(message);
    console.log('✅ PUSH SUCCESS:', response);
  } catch (err) {
    console.log('❌ PUSH ERROR:', err);

    // ✅ 👉 ТОВА Е ВАЖНОТО
    if (
      err.code === 'messaging/registration-token-not-registered' ||
      err.errorInfo?.code === 'messaging/registration-token-not-registered'
    ) {
      console.log('🧹 DELETING INVALID TOKEN:', fcmToken);

      await prisma.userDevice.deleteMany({
        where: {fcmToken},
      });
    }
  }
};

module.exports = {sendPush};
