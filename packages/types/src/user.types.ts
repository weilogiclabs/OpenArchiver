/**
 * Defines the possible roles a user can have within the system.
 */
export type UserRole = 'Super Administrator' | 'Auditor/Compliance Officer' | 'End User';

/**
 * Represents a user account in the system.
 */
export interface User {
    /**
     * The unique identifier for the user.
     */
    id: string;
    /**
     * The user's email address, used for login.
     */
    email: string;
    /**
     * The user's assigned role, which determines their permissions.
     */
    role: UserRole;
    /**
     * The hashed password for the user. This should never be exposed to the client.
     */
    passwordHash: string;
}
