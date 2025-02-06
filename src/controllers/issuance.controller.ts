/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';
import { IssuanceService } from '../services/issuance.service';

const issuanceService = new IssuanceService();

export const createIssuance = async (req: Request, res: Response) => {
    try {
        const issuance = await issuanceService.createIssuance(req.body);
        res.status(201).json(issuance);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const updateIssuance = async (req: Request, res: Response) => {
    try {
        const issuance = await issuanceService.updateIssuance(Number(req.params.id), req.body);
        if (!issuance) {
            return res.status(404).json({ message: 'Issuance not found' });
        }
        res.status(200).json(issuance);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const archiveIssuance = async (req: Request, res: Response) => {
    try {
        const issuance = await issuanceService.archiveIssuance(Number(req.params.id));
        if (!issuance) {
            return res.status(404).json({ message: 'Issuance not found' });
        }
        res.status(200).json(issuance);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const restoreIssuance = async (req: Request, res: Response) => {
    try {
        const issuance = await issuanceService.restoreIssuance(Number(req.params.id));
        if (!issuance) {
            return res.status(404).json({ message: 'Issuance not found' });
        }
        res.status(200).json(issuance);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteIssuance = async (req: Request, res: Response) => {
    try {
        const issuance = await issuanceService.deleteIssuance(Number(req.params.id));
        if (!issuance) {
            return res.status(404).json({ message: 'Issuance not found' });
        }
        res.status(200).json({ message: 'Issuance deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getAllIssuances = async (_req: Request, res: Response) => {
    try {
        const issuances = await issuanceService.findAll();
        res.status(200).json(issuances);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getIssuance = async (req: Request, res: Response) => {
    try {
        const issuance = await issuanceService.findOne(Number(req.params.id));
        if (!issuance) {
            return res.status(404).json({ message: 'Issuance not found' });
        }
        res.status(200).json(issuance);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};