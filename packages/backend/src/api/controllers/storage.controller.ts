import { Request, Response } from 'express';
import { StorageService } from '../../services/StorageService';

export class StorageController {
    constructor(private storageService: StorageService) { }

    public downloadFile = async (req: Request, res: Response): Promise<void> => {
        const filePath = req.query.path as string;

        if (!filePath) {
            res.status(400).send('File path is required');
            return;
        }

        try {
            const fileExists = await this.storageService.exists(filePath);
            if (!fileExists) {
                console.log(filePath);
                res.status(404).send('File not found');
                return;
            }

            const fileStream = await this.storageService.get(filePath);
            const fileName = filePath.split('/').pop();
            res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
            fileStream.pipe(res);
        } catch (error) {
            console.error('Error downloading file:', error);
            res.status(500).send('Error downloading file');
        }
    };
}
