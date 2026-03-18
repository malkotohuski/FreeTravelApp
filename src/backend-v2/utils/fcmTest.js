// fcmTest.js
const fetch = require('node-fetch');

const FCM_SERVER_KEY = 'TUY_FCM_SERVER_KEY'; // постави тук Server key от Firebase Console (Cloud Messaging)
const DEVICE_TOKEN =
  'e80o3_wpT7iM10-YAIwHe9:APA91bGcVW_DHjbFGssLRBhxZiVIlirt612lfzh3a3UN2W1UcH-jQZuHM1BsFTqrnVWdBTPL0fEKHlyDESK4cJ868pFSDpccUuBM7SfSFko2e35AIsT1L2w'; // постави токена от стъпка 1

async function sendTestPush() {
  const message = {
    to: DEVICE_TOKEN,
    notification: {
      title: 'Test Push',
      body: '🎉 Това е тестово push съобщение!',
    },
    data: {
      customData: 'Това е примерна data payload',
    },
  };

  try {
    const res = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `key=${FCM_SERVER_KEY}`,
      },
      body: JSON.stringify(message),
    });

    const data = await res.json();
    console.log('Test push sent', data);
  } catch (err) {
    console.error('Error sending test push:', err);
  }
}

sendTestPush();
