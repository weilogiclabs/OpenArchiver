import { Request, Response } from 'express';
import { ArchivedEmailService } from '../../services/ArchivedEmailService';

export class ArchivedEmailController {
    public getArchivedEmails = async (req: Request, res: Response): Promise<Response> => {
        try {
            const { ingestionSourceId } = req.params;
            const page = parseInt(req.query.page as string, 10) || 1;
            const limit = parseInt(req.query.limit as string, 10) || 10;

            const result = await ArchivedEmailService.getArchivedEmails(
                ingestionSourceId,
                page,
                limit
            );
            return res.status(200).json(result);
        } catch (error) {
            console.error('Get archived emails error:', error);
            return res.status(500).json({ message: 'An internal server error occurred' });
        }
    };

    public getArchivedEmailById = async (req: Request, res: Response): Promise<Response> => {
        try {
            const { id } = req.params;
            const email = await ArchivedEmailService.getArchivedEmailById(id);
            if (!email) {
                return res.status(404).json({ message: 'Archived email not found' });
            }
            return res.status(200).json(email);
        } catch (error) {
            console.error(`Get archived email by id ${req.params.id} error:`, error);
            return res.status(500).json({ message: 'An internal server error occurred' });
        }
    };
}
