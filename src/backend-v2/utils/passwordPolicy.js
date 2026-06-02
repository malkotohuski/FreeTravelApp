const {Buffer} = require('buffer');

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_BYTES = 72;
const PASSWORD_POLICY_MESSAGE =
  'Password must be 8-72 characters, include at least one letter and one number, and must not start or end with spaces.';

function hasLetter(value) {
  return Array.from(value).some(char => char.toLowerCase() !== char.toUpperCase());
}

function validatePassword(password) {
  if (typeof password !== 'string') {
    return {isValid: false, error: PASSWORD_POLICY_MESSAGE};
  }

  if (password !== password.trim()) {
    return {isValid: false, error: PASSWORD_POLICY_MESSAGE};
  }

  if (
    password.length < PASSWORD_MIN_LENGTH ||
    Buffer.byteLength(password, 'utf8') > PASSWORD_MAX_BYTES
  ) {
    return {isValid: false, error: PASSWORD_POLICY_MESSAGE};
  }

  if (!hasLetter(password) || !/\d/.test(password)) {
    return {isValid: false, error: PASSWORD_POLICY_MESSAGE};
  }

  return {isValid: true, error: null};
}

module.exports = {
  PASSWORD_POLICY_MESSAGE,
  validatePassword,
};
