import { AppBindings } from "@server/types";

/**
 * Generate a SHA-256 hash of the API key for integrity validation.
 * This function looks perfect, no changes needed.
 */
export async function generateKeyHash(apiKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function uint8ArrayToBase64(array: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < array.byteLength; i++) {
    binary += String.fromCharCode(array[i]);
  }
  return btoa(binary);
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary_string = atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes;
}

/**
 * Encrypt an API key using AES-GCM with PBKDF2 key derivation.
 */
export async function encryptKey(
  apiKey: string,
  secret: string,
): Promise<string> {
  const encoder = new TextEncoder();

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'PBKDF2' },
    false,
    ['deriveKey'],
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt, // Use the generated salt
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true, // Key is now extractable if needed, but we'll use it directly
    ['encrypt'],
  );
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(apiKey),
  );
  const combined = new Uint8Array(
    salt.length + iv.length + encrypted.byteLength,
  );
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(encrypted), salt.length + iv.length);
  return uint8ArrayToBase64(combined);
}

/**
 * Decrypt an API key using AES-GCM.
 */
export async function decryptKey(
  encryptedData: string,
  secret: string,
): Promise<string | null> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  try {
    const combined = base64ToUint8Array(encryptedData);
    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const encrypted = combined.slice(28);
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'PBKDF2' },
      false,
      ['deriveKey'],
    );

    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['decrypt'],
    );
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted,
    );

    return decoder.decode(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error);
    // Return null if decryption fails (e.g., wrong secret, tampered data)
    return null;
  }
}

export const getApiKey = async (
  userId: string,
  provider: string,
  db: AppBindings['Variables']['db'],
  globalKey: string,
  encryptionSecret: string,
): Promise<string> => {
  const userKeys = await db.query({
    apiKeys: {
      $: { where: { userId, provider, isActive: true } },
    },
  });

  if (userKeys.apiKeys.length > 0) {
    const userKey = userKeys.apiKeys[0];
    const decryptedKey = await decryptKey(
      userKey.encryptedKey,
      encryptionSecret,
    );
    const verificationHash = await generateKeyHash(decryptedKey);
    if (verificationHash === userKey.keyHash) {
      return decryptedKey;
    }
  }
  return globalKey;
};
