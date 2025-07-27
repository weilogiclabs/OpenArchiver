import { Request, Response } from 'express';
import { IngestionService } from '../../services/IngestionService';
import { CreateIngestionSourceDto, UpdateIngestionSourceDto } from '@open-archiver/types';

export class IngestionController {
    public create = async (req: Request, res: Response): Promise<Response> => {
        try {
            const dto: CreateIngestionSourceDto = req.body;
            const newSource = await IngestionService.create(dto);
            return res.status(201).json(newSource);
        } catch (error) {
            console.error('Create ingestion source error:', error);
            return res.status(500).json({ message: 'An internal server error occurred' });
        }
    };

    public findAll = async (req: Request, res: Response): Promise<Response> => {
        try {
            const sources = await IngestionService.findAll();
            return res.status(200).json(sources);
        } catch (error) {
            console.error('Find all ingestion sources error:', error);
            return res.status(500).json({ message: 'An internal server error occurred' });
        }
    };

    public findById = async (req: Request, res: Response): Promise<Response> => {
        try {
            const { id } = req.params;
            const source = await IngestionService.findById(id);
            return res.status(200).json(source);
        } catch (error) {
            console.error(`Find ingestion source by id ${req.params.id} error:`, error);
            if (error instanceof Error && error.message === 'Ingestion source not found') {
                return res.status(404).json({ message: error.message });
            }
            return res.status(500).json({ message: 'An internal server error occurred' });
        }
    };

    public update = async (req: Request, res: Response): Promise<Response> => {
        try {
            const { id } = req.params;
            const dto: UpdateIngestionSourceDto = req.body;
            const updatedSource = await IngestionService.update(id, dto);
            return res.status(200).json(updatedSource);
        } catch (error) {
            console.error(`Update ingestion source ${req.params.id} error:`, error);
            if (error instanceof Error && error.message === 'Ingestion source not found') {
                return res.status(404).json({ message: error.message });
            }
            return res.status(500).json({ message: 'An internal server error occurred' });
        }
    };

    public delete = async (req: Request, res: Response): Promise<Response> => {
        try {
            const { id } = req.params;
            await IngestionService.delete(id);
            return res.status(204).send();
        } catch (error) {
            console.error(`Delete ingestion source ${req.params.id} error:`, error);
            if (error instanceof Error && error.message === 'Ingestion source not found') {
                return res.status(404).json({ message: error.message });
            }
            return res.status(500).json({ message: 'An internal server error occurred' });
        }
    };

    public triggerInitialImport = async (req: Request, res: Response): Promise<Response> => {
        try {
            const { id } = req.params;
            await IngestionService.triggerInitialImport(id);
            return res.status(202).json({ message: 'Initial import triggered successfully.' });
        } catch (error) {
            console.error(`Trigger initial import for ${req.params.id} error:`, error);
            if (error instanceof Error && error.message === 'Ingestion source not found') {
                return res.status(404).json({ message: error.message });
            }
            return res.status(500).json({ message: 'An internal server error occurred' });
        }
    };

    public pause = async (req: Request, res: Response): Promise<Response> => {
        try {
            const { id } = req.params;
            const updatedSource = await IngestionService.update(id, { status: 'paused' });
            return res.status(200).json(updatedSource);
        } catch (error) {
            console.error(`Pause ingestion source ${req.params.id} error:`, error);
            if (error instanceof Error && error.message === 'Ingestion source not found') {
                return res.status(404).json({ message: error.message });
            }
            return res.status(500).json({ message: 'An internal server error occurred' });
        }
    };

    public triggerForceSync = async (req: Request, res: Response): Promise<Response> => {
        try {
            const { id } = req.params;
            await IngestionService.triggerForceSync(id);
            return res.status(202).json({ message: 'Force sync triggered successfully.' });
        } catch (error) {
            console.error(`Trigger force sync for ${req.params.id} error:`, error);
            if (error instanceof Error && error.message === 'Ingestion source not found') {
                return res.status(404).json({ message: error.message });
            }
            return res.status(500).json({ message: 'An internal server error occurred' });
        }
    };
}
