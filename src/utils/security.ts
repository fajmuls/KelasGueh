// Web Crypto API SHA-256 hashing utility for PIN and password security
export const hashStringSHA256 = async (text: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

// Default hashed 6-digit PIN: '123456'
export const DEFAULT_PIN = '123456';
const PIN_STORAGE_KEY = 'kelasgue_pin_hash_v1';

export const getStoredPinHash = async (): Promise<string> => {
  const saved = localStorage.getItem(PIN_STORAGE_KEY);
  if (saved) return saved;
  const defaultHash = await hashStringSHA256(DEFAULT_PIN);
  localStorage.setItem(PIN_STORAGE_KEY, defaultHash);
  return defaultHash;
};

export const saveNewPin = async (newPin: string): Promise<void> => {
  if (!/^\d{6}$/.test(newPin)) {
    throw new Error('PIN harus terdiri dari tepat 6 digit angka.');
  }
  const hash = await hashStringSHA256(newPin);
  localStorage.setItem(PIN_STORAGE_KEY, hash);
};

export const verifyPinInput = async (inputPin: string): Promise<boolean> => {
  const storedHash = await getStoredPinHash();
  const inputHash = await hashStringSHA256(inputPin);
  return inputHash === storedHash;
};
