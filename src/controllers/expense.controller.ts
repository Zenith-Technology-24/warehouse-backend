import { Request, Response } from 'express';
import { Status } from '../enums/inventory.enum';
import { ExpenseService } from '../services/expense.service';

const expenseService = new ExpenseService();

export const getAllExpense = async (req: Request, res: Response) => {
    try {
        const expense = await expenseService.getAllExpense({ req });
        res.status(200).json(expense);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getExportExpense = async (req: Request, res: Response) => {
    try {
        const expense = await expenseService.getExportExpense({ req });
        res.status(200).json(expense);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const createExpense = async (req: Request, res: Response) => {
    try {
        const expense = await expenseService.createExpense(req.body);
        res.status(201).json(expense);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}

export const updateExpense = async (req: Request, res: Response): Promise<void> => {
    const updatedInventory = await expenseService.updateExpense(Number(req.params.id), req.body);
    if (updatedInventory) {
        res.json(updatedInventory);
    } else {
        res.status(404).json({ message: "Expense not found" });
    }
}

export const updateStatusExpense = async (req: Request, res: Response): Promise<void> => {
    if (!Object.values(Status).includes(req.params.status as Status)) {
        res.status(400).json({ message: `Invalid status value. Allowed values are: ${Object.values(Status).join(', ')}` });
        return;
    }

    const updatedExpense = await expenseService.updateStatus(Number(req.params.id), req.params.status);
    if (updatedExpense) {
        res.json({
            expense: updatedExpense,
            message: "Expense status updated successfully"
        });
    } else {
        res.status(404).json({ message: "Expense not found" });
    }
}