import type { Request, Response } from 'express';
import type { IAuthService } from '../../services/AuthService';

export class AuthController {
    #authService: IAuthService;

    constructor(authService: IAuthService) {
        this.#authService = authService;
    }

    public login = async (req: Request, res: Response): Promise<Response> => {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        try {
            const result = await this.#authService.login(email, password);

            if (!result) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            return res.status(200).json(result);
        } catch (error) {
            // In a real application, you'd want to log this error.
            console.error('Login error:', error);
            return res.status(500).json({ message: 'An internal server error occurred' });
        }
    };
}
