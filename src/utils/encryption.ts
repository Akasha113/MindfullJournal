/**
 * 🔒 CLIENT-SIDE ENCRYPTION UTILITY
 * 
 * Uses Web Crypto API (SubtleCrypto) for AES-GCM encryption.
 * Data is encrypted on the client BEFORE sending to backend.
 * Backend cannot decrypt without user's encryption key.
 * 
 * Security:
 * - Uses AES-256-GCM for authenticated encryption
 * - IV (Initialization Vector) is randomly generated per message
 * - Encryption key is derived from user email + password hash
 * - Authentication tag ensures data integrity & authenticity
 */

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256; // 256-bit key
const IV_LENGTH = 12; // 96-bit IV (recommended for GCM)

/**
 * Derive encryption key from user credentials
 * This key is generated from user's email + password hash
 * NEVER sent to server - only used client-side
 */
export const deriveEncryptionKey = async (
  email: string,
  passwordHash: string
): Promise<CryptoKey> => {
  const combined = `${email}:${passwordHash}`;
  
  // First, create a hash of the combined string
  const buffer = new TextEncoder().encode(combined);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  
  // Then import as a CryptoKey
  const key = await crypto.subtle.importKey(
    'raw',
    hashBuffer,
    { name: ALGORITHM },
    false,
    ['encrypt', 'decrypt']
  );
  
  return key;
};

/**
 * Encrypt data with AES-GCM
 * Returns object with encrypted data, IV, and auth tag
 */
export const encryptData = async (
  data: any,
  key: CryptoKey
): Promise<{
  encryptedData: string; // Base64 encoded
  iv: string; // Base64 encoded IV
  authTag: string; // Base64 encoded auth tag
}> => {
  try {
    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    
    // Convert data to JSON string then to ArrayBuffer
    const jsonString = JSON.stringify(data);
    const dataBuffer = new TextEncoder().encode(jsonString);
    
    // Encrypt with AES-GCM
    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: ALGORITHM,
        iv: iv,
      },
      key,
      dataBuffer
    );
    
    // Extract authentication tag (last 16 bytes for GCM)
    const encryptedArray = new Uint8Array(encryptedBuffer);
    const authTag = encryptedArray.slice(-16);
    const encryptedData = encryptedArray.slice(0, -16);
    
    return {
      encryptedData: base64Encode(encryptedData),
      iv: base64Encode(iv),
      authTag: base64Encode(authTag),
    };
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Decrypt data with AES-GCM
 */
export const decryptData = async (
  encryptedData: string, // Base64 encoded
  iv: string, // Base64 encoded
  authTag: string, // Base64 encoded
  key: CryptoKey
): Promise<any> => {
  try {
    // Decode from base64
    const encryptedBytes = base64Decode(encryptedData);
    const ivBytes = base64Decode(iv);
    const authTagBytes = base64Decode(authTag);
    
    // Combine encrypted data + auth tag for GCM
    const combined = new Uint8Array(encryptedBytes.length + authTagBytes.length);
    combined.set(encryptedBytes);
    combined.set(authTagBytes, encryptedBytes.length);
    
    // Decrypt with AES-GCM
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: ALGORITHM,
        iv: ivBytes,
      },
      key,
      combined
    );
    
    // Convert back to JSON
    const jsonString = new TextDecoder().decode(decryptedBuffer);
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt data - key or data may be corrupted');
  }
};

/**
 * Generate hash of data for integrity verification
 */
export const hashData = async (data: any): Promise<string> => {
  const jsonString = JSON.stringify(data);
  const buffer = new TextEncoder().encode(jsonString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  return base64Encode(new Uint8Array(hashBuffer));
};

/**
 * Verify data integrity using hash
 */
export const verifyDataIntegrity = async (
  data: any,
  expectedHash: string
): Promise<boolean> => {
  try {
    const calculatedHash = await hashData(data);
    return calculatedHash === expectedHash;
  } catch {
    return false;
  }
};

// =====================================
// HELPER FUNCTIONS
// =====================================

/**
 * Convert Uint8Array to Base64 string
 */
const base64Encode = (bytes: Uint8Array): string => {
  const binaryString = String.fromCharCode.apply(null, Array.from(bytes));
  return btoa(binaryString);
};

/**
 * Convert Base64 string to Uint8Array
 */
const base64Decode = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

/**
 * Get user's encryption key from stored credentials
 * This is called whenever we need to encrypt/decrypt
 */
export const getUserEncryptionKey = async (): Promise<CryptoKey | null> => {
  try {
    // Get user's password hash from sessionStorage/localStorage (set during login)
    const authData = sessionStorage.getItem('authData') || localStorage.getItem('authData');
    if (!authData) return null;
    
    const parsed = JSON.parse(authData);
    const { email, passwordHash } = parsed;
    
    if (!email || !passwordHash) {
      console.warn('Missing email or passwordHash for encryption key derivation');
      return null;
    }
    
    return await deriveEncryptionKey(email, passwordHash);
  } catch (error) {
    console.error('Failed to get encryption key:', error);
    return null;
  }
};
