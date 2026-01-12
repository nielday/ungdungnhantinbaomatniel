/**
 * E2EE Encryption Module using Web Crypto API
 * 
 * Implements:
 * - ECDH (Elliptic Curve Diffie-Hellman) for key exchange
 * - AES-256-GCM for message encryption
 * - PBKDF2 for deriving encryption key from password
 */

// Generate ECDH key pair for a user
export async function generateKeyPair(): Promise<CryptoKeyPair> {
    return await crypto.subtle.generateKey(
        {
            name: 'ECDH',
            namedCurve: 'P-256'
        },
        true, // extractable
        ['deriveKey', 'deriveBits']
    );
}

// Export public key to base64 string for storage/sharing
export async function exportPublicKey(publicKey: CryptoKey): Promise<string> {
    const exported = await crypto.subtle.exportKey('spki', publicKey);
    return arrayBufferToBase64(exported);
}

// Export private key to base64 string
export async function exportPrivateKey(privateKey: CryptoKey): Promise<string> {
    const exported = await crypto.subtle.exportKey('pkcs8', privateKey);
    return arrayBufferToBase64(exported);
}

// Import public key from base64 string
export async function importPublicKey(publicKeyBase64: string): Promise<CryptoKey> {
    const keyData = base64ToArrayBuffer(publicKeyBase64);
    return await crypto.subtle.importKey(
        'spki',
        keyData,
        {
            name: 'ECDH',
            namedCurve: 'P-256'
        },
        true,
        []
    );
}

// Import private key from base64 string
export async function importPrivateKey(privateKeyBase64: string): Promise<CryptoKey> {
    const keyData = base64ToArrayBuffer(privateKeyBase64);
    return await crypto.subtle.importKey(
        'pkcs8',
        keyData,
        {
            name: 'ECDH',
            namedCurve: 'P-256'
        },
        true,
        ['deriveKey', 'deriveBits']
    );
}

// Derive shared secret from own private key and other's public key
export async function deriveSharedKey(
    privateKey: CryptoKey,
    publicKey: CryptoKey
): Promise<CryptoKey> {
    return await crypto.subtle.deriveKey(
        {
            name: 'ECDH',
            public: publicKey
        },
        privateKey,
        {
            name: 'AES-GCM',
            length: 256
        },
        false,
        ['encrypt', 'decrypt']
    );
}

// Generate random IV for AES-GCM
function generateIV(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(12));
}

// Encrypt message using AES-256-GCM
export async function encryptMessage(
    plaintext: string,
    sharedKey: CryptoKey
): Promise<{ ciphertext: string; iv: string }> {
    const iv = generateIV();
    const encodedMessage = new TextEncoder().encode(plaintext);

    const encryptedData = await crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv: iv as BufferSource
        },
        sharedKey,
        encodedMessage
    );

    return {
        ciphertext: arrayBufferToBase64(encryptedData),
        iv: arrayBufferToBase64(iv)
    };
}

// Decrypt message using AES-256-GCM
export async function decryptMessage(
    ciphertext: string,
    iv: string,
    sharedKey: CryptoKey
): Promise<string> {
    const ciphertextBuffer = base64ToArrayBuffer(ciphertext);
    const ivBuffer = base64ToArrayBuffer(iv);

    const decryptedData = await crypto.subtle.decrypt(
        {
            name: 'AES-GCM',
            iv: ivBuffer
        },
        sharedKey,
        ciphertextBuffer
    );

    return new TextDecoder().decode(decryptedData);
}

// Encrypt private key with user password (for storage in DB)
export async function encryptPrivateKeyWithPassword(
    privateKeyBase64: string,
    password: string
): Promise<{ encryptedKey: string; salt: string; iv: string }> {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = generateIV();

    // Derive key from password using PBKDF2
    const passwordKey = await deriveKeyFromPassword(password, salt);

    const encodedPrivateKey = new TextEncoder().encode(privateKeyBase64);

    const encryptedKey = await crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv: iv as BufferSource
        },
        passwordKey,
        encodedPrivateKey
    );

    return {
        encryptedKey: arrayBufferToBase64(encryptedKey),
        salt: arrayBufferToBase64(salt),
        iv: arrayBufferToBase64(iv)
    };
}

// Decrypt private key with user password
export async function decryptPrivateKeyWithPassword(
    encryptedKey: string,
    salt: string,
    iv: string,
    password: string
): Promise<string> {
    const saltBuffer = base64ToArrayBuffer(salt);
    const ivBuffer = base64ToArrayBuffer(iv);
    const encryptedKeyBuffer = base64ToArrayBuffer(encryptedKey);

    // Derive key from password using PBKDF2
    const passwordKey = await deriveKeyFromPassword(password, saltBuffer);

    const decryptedKey = await crypto.subtle.decrypt(
        {
            name: 'AES-GCM',
            iv: ivBuffer
        },
        passwordKey,
        encryptedKeyBuffer
    );

    return new TextDecoder().decode(decryptedKey);
}

// Derive encryption key from password using PBKDF2
async function deriveKeyFromPassword(
    password: string,
    salt: Uint8Array | ArrayBuffer
): Promise<CryptoKey> {
    const encodedPassword = new TextEncoder().encode(password);

    const passwordKey = await crypto.subtle.importKey(
        'raw',
        encodedPassword,
        'PBKDF2',
        false,
        ['deriveKey']
    );

    return await crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt as BufferSource,
            iterations: 100000,
            hash: 'SHA-256'
        },
        passwordKey,
        {
            name: 'AES-GCM',
            length: 256
        },
        false,
        ['encrypt', 'decrypt']
    );
}

// Generate fingerprint of public key (for display)
export async function getKeyFingerprint(publicKeyBase64: string): Promise<string> {
    const keyData = base64ToArrayBuffer(publicKeyBase64);
    const hash = await crypto.subtle.digest('SHA-256', keyData);
    const hashArray = Array.from(new Uint8Array(hash));

    // Format as hex pairs separated by colons (first 8 bytes)
    return hashArray
        .slice(0, 8)
        .map(b => b.toString(16).padStart(2, '0').toUpperCase())
        .join(':');
}

// Generate unique device ID
export function generateDeviceId(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

// Get or create device ID from localStorage
export function getDeviceId(): string {
    if (typeof window === 'undefined') return '';

    let deviceId = localStorage.getItem('e2ee_device_id');
    if (!deviceId) {
        deviceId = generateDeviceId();
        localStorage.setItem('e2ee_device_id', deviceId);
    }
    return deviceId;
}

// Get device name (browser + OS)
export function getDeviceName(): string {
    if (typeof window === 'undefined') return 'Unknown Device';

    const ua = navigator.userAgent;
    let browser = 'Unknown Browser';
    let os = 'Unknown OS';

    // Detect browser
    if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Safari')) browser = 'Safari';
    else if (ua.includes('Edge')) browser = 'Edge';

    // Detect OS
    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

    return `${browser} on ${os}`;
}

// Encrypt a string with a password (for backup)
export async function encryptStringWithPassword(
    text: string,
    password: string
): Promise<{ ciphertext: string; iv: string; salt: string }> {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Import password
    const passwordKey = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
    );

    // Derive encryption key
    const key = await crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: 100000,
            hash: 'SHA-256'
        },
        passwordKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt']
    );

    // Encrypt content
    const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        new TextEncoder().encode(text)
    );

    return {
        ciphertext: arrayBufferToBase64(encrypted),
        iv: arrayBufferToBase64(iv),
        salt: arrayBufferToBase64(salt)
    };
}

// Decrypt a string with password (for restore)
export async function decryptStringWithPassword(
    ciphertext: string,
    password: string,
    saltBase64: string,
    ivBase64: string
): Promise<string> {
    const salt = base64ToArrayBuffer(saltBase64);
    const iv = base64ToArrayBuffer(ivBase64);
    const encryptedData = base64ToArrayBuffer(ciphertext);

    // Import password
    const passwordKey = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
    );

    // Derive encryption key
    const key = await crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt as BufferSource,
            iterations: 100000,
            hash: 'SHA-256'
        },
        passwordKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt']
    );

    // Decrypt content
    const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv as BufferSource },
        key,
        encryptedData
    );

    return new TextDecoder().decode(decryptedBuffer);
}

// Helper: Convert ArrayBuffer or Uint8Array to Base64
function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

// Helper: Convert Base64 to ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer as ArrayBuffer;
}

// Encrypt file/image data
export async function encryptFile(
    fileData: ArrayBuffer,
    sharedKey: CryptoKey
): Promise<{ encryptedData: ArrayBuffer; iv: string }> {
    const iv = generateIV();

    const encryptedData = await crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv: iv as BufferSource
        },
        sharedKey,
        fileData
    );

    return {
        encryptedData,
        iv: arrayBufferToBase64(iv)
    };
}

// Decrypt file/image data
export async function decryptFile(
    encryptedData: ArrayBuffer,
    iv: string,
    sharedKey: CryptoKey
): Promise<ArrayBuffer> {
    const ivBuffer = base64ToArrayBuffer(iv);

    return await crypto.subtle.decrypt(
        {
            name: 'AES-GCM',
            iv: ivBuffer
        },
        sharedKey,
        encryptedData
    );
}
