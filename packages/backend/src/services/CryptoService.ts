import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';
import { config } from '../config';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const ENCRYPTION_KEY = config.app.encryptionKey;

if (!ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY is not set in environment variables.');
}

// Derive a key from the master encryption key and a salt
const getKey = (salt: Buffer): Buffer => {
    return scryptSync(ENCRYPTION_KEY, salt, 32);
};

export class CryptoService {
    public static encrypt(value: string): string {
        const salt = randomBytes(SALT_LENGTH);
        const key = getKey(salt);
        const iv = randomBytes(IV_LENGTH);
        const cipher = createCipheriv(ALGORITHM, key, iv);

        const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
        const tag = cipher.getAuthTag();

        return Buffer.concat([salt, iv, tag, encrypted]).toString('hex');
    }

    public static decrypt(encrypted: string): string {
        const data = Buffer.from(encrypted, 'hex');
        const salt = data.subarray(0, SALT_LENGTH);
        const iv = data.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
        const tag = data.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
        const encryptedValue = data.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

        const key = getKey(salt);
        const decipher = createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(tag);

        const decrypted = Buffer.concat([decipher.update(encryptedValue), decipher.final()]);

        return decrypted.toString('utf8');
    }

    public static encryptObject<T extends object>(obj: T): string {
        const jsonString = JSON.stringify(obj);
        return this.encrypt(jsonString);
    }

    public static decryptObject<T extends object>(encrypted: string): T {
        const decryptedString = this.decrypt(encrypted);
        return JSON.parse(decryptedString) as T;
    }
}
