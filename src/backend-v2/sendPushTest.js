const {GoogleAuth} = require('google-auth-library');
const path = require('path');
const fetch = require('node-fetch'); // ако нямаш, npm install node-fetch@2

// Вземи service account JSON от Firebase
const serviceAccount = require(path.join(
  __dirname,
  'config/freetravelapp-507ff-firebase-adminsdk-fbsvc-2d9f7800e1.json',
));

// Твоят FCM токен от App.js
const DEVICE_TOKEN =
  'e80o3_wpT7iM10-YAIwHe9:APA91bGcVW_DHjbFGssLRBhxZiVIlirt612lfzh3a3UN2W1UcH-jQZuHM1BsFTqrnVWdBTPL0fEKHlyDESK4cJ868pFSDpccUuBM7SfSFko2e35AIsT1L2w';
const PROJECT_ID = serviceAccount.project_id;

async function sendPush() {
  const auth = new GoogleAuth({
    credentials: serviceAccount,
    scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
  });

  const client = await auth.getClient();
  const accessToken = await client.getAccessToken();

  const message = {
    message: {
      token: DEVICE_TOKEN,
      notification: {
        title: 'Test Push 🚀',
        body: 'Това е реална нотификация към твоя телефон!',
      },
      data: {
        screen: 'Home', // можеш да пратиш допълнителни данни
      },
    },
  };

  const url = `https://fcm.googleapis.com/v1/projects/${PROJECT_ID}/messages:send`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });

  const data = await res.json();
  console.log('Push result:', data);
}

sendPush().catch(console.error);
