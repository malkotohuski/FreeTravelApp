const {GoogleAuth} = require('google-auth-library');
const path = require('path');
const serviceAccount = require(path.join(
  __dirname,
  'config/freetravelapp-507ff-firebase-adminsdk-fbsvc-2d9f7800e1.json',
));

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
        title: 'Test Push v1',
        body: '🚀 Работи с новия FCM v1 API!',
      },
      data: {
        customKey: 'customValue',
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

sendPush();
