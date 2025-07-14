import { compare, hash } from 'bcryptjs';
import type { SignJWT, jwtVerify } from 'jose';
import type { AuthTokenPayload, User, LoginResponse } from '@open-archiver/types';

// This interface defines the contract for a service that manages users.
// The AuthService will depend on this abstraction, not a concrete implementation.
export interface IUserService {
    findByEmail(email: string): Promise<User | null>;
}

// This interface defines the contract for our AuthService.
export interface IAuthService {
    verifyPassword(password: string, hash: string): Promise<boolean>;
    login(email: string, password: string): Promise<LoginResponse | null>;
    verifyToken(token: string): Promise<AuthTokenPayload | null>;
}

export class AuthService implements IAuthService {
    #userService: IUserService;
    #jwtSecret: Uint8Array;
    #jwtExpiresIn: string;
    #jose: Promise<{ SignJWT: typeof SignJWT; jwtVerify: typeof jwtVerify; }>;

    constructor(userService: IUserService, jwtSecret: string, jwtExpiresIn: string) {
        this.#userService = userService;
        this.#jwtSecret = new TextEncoder().encode(jwtSecret);
        this.#jwtExpiresIn = jwtExpiresIn;
        this.#jose = import('jose');
    }

    #hashPassword(password: string): Promise<string> {
        return hash(password, 10);
    }

    public verifyPassword(password: string, hash: string): Promise<boolean> {
        return compare(password, hash);
    }

    async #generateAccessToken(payload: AuthTokenPayload): Promise<string> {
        if (!payload.sub) {
            throw new Error('JWT payload must have a subject (sub) claim.');
        }
        const { SignJWT } = await this.#jose;
        return new SignJWT(payload)
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setSubject(payload.sub)
            .setExpirationTime(this.#jwtExpiresIn)
            .sign(this.#jwtSecret);
    }

    public async login(email: string, password: string): Promise<LoginResponse | null> {
        const user = await this.#userService.findByEmail(email);

        if (!user) {
            return null; // User not found
        }

        const isPasswordValid = await this.verifyPassword(password, user.passwordHash);

        if (!isPasswordValid) {
            return null; // Invalid password
        }

        const { passwordHash, ...userWithoutPassword } = user;

        const accessToken = await this.#generateAccessToken({
            sub: user.id,
            email: user.email,
            role: user.role,
        });

        return { accessToken, user: userWithoutPassword };
    }

    public async verifyToken(token: string): Promise<AuthTokenPayload | null> {
        try {
            const { jwtVerify } = await this.#jose;
            const { payload } = await jwtVerify<AuthTokenPayload>(token, this.#jwtSecret);
            return payload;
        } catch (error) {
            // Token is invalid or expired
            return null;
        }
    }
}
