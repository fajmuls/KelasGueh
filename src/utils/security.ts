import bcrypt from 'bcryptjs';

// bcryptjs hashing utility for PIN security (Standard bcrypt)
export const hashPinBcrypt = (pin: string): string => {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(pin, salt);
};

// Default hashed 6-digit PIN: '123456'
export const DEFAULT_PIN = '123456';
const PIN_STORAGE_KEY = 'kelasgue_pin_bcrypt_v1';

export const getStoredPinHash = (): string => {
  const saved = localStorage.getItem(PIN_STORAGE_KEY);
  if (saved) return saved;
  
  // Initialize with default PIN if none exists
  const defaultHash = hashPinBcrypt(DEFAULT_PIN);
  localStorage.setItem(PIN_STORAGE_KEY, defaultHash);
  return defaultHash;
};

export const saveNewPin = (newPin: string): void => {
  if (!/^\d{6}$/.test(newPin)) {
    throw new Error('PIN harus terdiri dari tepat 6 digit angka.');
  }
  const hash = hashPinBcrypt(newPin);
  localStorage.setItem(PIN_STORAGE_KEY, hash);
};

export const verifyPinInput = (inputPin: string): boolean => {
  const storedHash = getStoredPinHash();
  try {
    return bcrypt.compareSync(inputPin, storedHash);
  } catch (err) {
    return false;
  }
};
