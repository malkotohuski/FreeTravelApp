const admin = require('firebase-admin');
const serviceAccount = require('../freetravelapp-507ff-firebase-adminsdk-fbsvc-05ede23443.json');

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
      notification: {
        title,
        body,
      },
      data,
    };

    const response = await admin.messaging().send(message);

    console.log('✅ PUSH SUCCESS:', response);
  } catch (err) {
    console.log('❌ PUSH ERROR:', err);
  }
};

module.exports = {sendPush};
