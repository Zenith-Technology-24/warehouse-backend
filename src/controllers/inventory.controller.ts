import { Request, Response } from 'express';
import { InventoryService } from '..//services/inventory.service';
import { Status } from '../enums/inventory.enum';

const inventoryService = new InventoryService();

export const getAllInventory = async (req: Request, res: Response) => {
    try {
        const inventory = await inventoryService.getAllInventory({ req });
        res.status(200).json(inventory);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getExportInventory = async (req: Request, res: Response) => {
    try {
        const inventory = await inventoryService.getExportInventory({ req });
        res.status(200).json(inventory);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getAllProductNames = async (req: Request, res: Response) => {
    try {
        const names = await inventoryService.getAllProductNames({ req });
        res.status(200).json(names);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const createInventory = async (req: Request, res: Response) => {
    try {
        const inventory = await inventoryService.createInventory(req.body);
        res.status(201).json(inventory);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}

export const updateInventory = async (req: Request, res: Response): Promise<void> => {
    const updatedInventory = await inventoryService.updateInventory(Number(req.params.id), req.body);
    if (updatedInventory) {
        res.json(updatedInventory);
    } else {
        res.status(404).json({ message: "Inventory not found" });
    }
}

export const deleteInventory = async (req: Request, res: Response): Promise<void> => {
    const success = await inventoryService.deleteInventory(Number(req.params.id));
    if (success) {
        res.status(200).json({ message: "Inventory deleted successfully" });
    } else {
        res.status(404).json({ message: "Inventory not found" });
    }
}

export const updateStatusInventory = async (req: Request, res: Response): Promise<void> => {
    if (!Object.values(Status).includes(req.params.status as Status)) {
        res.status(400).json({ message: `Invalid status value. Allowed values are: ${Object.values(Status).join(', ')}` });
        return;
    }

    const updatedInventory = await inventoryService.updateStatus(Number(req.params.id), req.params.status);
    if (updatedInventory) {
        res.json({
            inventory: updatedInventory,
            message: "Inventory status updated successfully"
        });
    } else {
        res.status(404).json({ message: "Inventory not found" });
    }
}