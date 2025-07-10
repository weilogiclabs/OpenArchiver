export type UserRole = 'Admin' | 'Auditor' | 'EndUser';

export interface User {
    id: string;
    email: string;
    role: UserRole;
}
