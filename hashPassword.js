const bcrypt = require('bcrypt');

const SALT_ROUNDS = 12; // колко "силно" се хешира
const plainPassword = '12345678'; // тук сложи паролата, която искаш да хешираш

async function hashPassword() {
  try {
    const hashed = await bcrypt.hash(plainPassword, SALT_ROUNDS);
    console.log('Хеширана парола:', hashed);
  } catch (err) {
    console.error(err);
  }
}

hashPassword();
