export const PASSWORD_POLICY_MESSAGE =
  'Password must be 8-72 characters, include at least one letter and one number, and must not start or end with spaces.';
const PASSWORD_POLICY_MESSAGE_BG =
  'Паролата трябва да е 8-72 символа, да съдържа поне 1 буква и 1 цифра и да няма интервали в началото или края.';
export const PASSWORD_REQUIREMENTS_TEXT =
  'Use 8-72 characters, at least 1 letter and 1 number. No spaces at the start or end.';
const PASSWORD_REQUIREMENTS_TEXT_BG =
  'Използвай 8-72 символа, поне 1 буква и 1 цифра. Без интервали в началото или края.';

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_BYTES = 72;

function hasLetter(value) {
  return Array.from(value).some(char => char.toLowerCase() !== char.toUpperCase());
}

function getUtf8ByteLength(value) {
  try {
    return encodeURIComponent(value).replace(/%[A-F\d]{2}/g, 'x').length;
  } catch {
    return Number.POSITIVE_INFINITY;
  }
}

export function validatePassword(password) {
  if (typeof password !== 'string') {
    return {isValid: false, error: PASSWORD_POLICY_MESSAGE};
  }

  if (password !== password.trim()) {
    return {isValid: false, error: PASSWORD_POLICY_MESSAGE};
  }

  if (
    password.length < PASSWORD_MIN_LENGTH ||
    getUtf8ByteLength(password) > PASSWORD_MAX_BYTES
  ) {
    return {isValid: false, error: PASSWORD_POLICY_MESSAGE};
  }

  if (!hasLetter(password) || !/\d/.test(password)) {
    return {isValid: false, error: PASSWORD_POLICY_MESSAGE};
  }

  return {isValid: true, error: null};
}

export function getPasswordRequirementsText(language) {
  return language?.startsWith('bg')
    ? PASSWORD_REQUIREMENTS_TEXT_BG
    : PASSWORD_REQUIREMENTS_TEXT;
}

export function getPasswordPolicyMessage(language) {
  return language?.startsWith('bg')
    ? PASSWORD_POLICY_MESSAGE_BG
    : PASSWORD_POLICY_MESSAGE;
}
