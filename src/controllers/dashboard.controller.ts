import { Response } from 'express';
import { ExpenseService } from '../services/expense.service';
import { InventoryService } from '../services/inventory.service';
import { SalesInventoryService } from '../services/salesInventory.service';

const expenseService = new ExpenseService()
const inventoryService = new InventoryService()
const salesinventoryService = new SalesInventoryService()

export const dashboardData = async (req: any, res: Response) => {
    const expense = await expenseService.countExpenses()
    const inventory = await inventoryService.countInventories()
    const sales = await salesinventoryService.countSalesinventory()

    res.status(200).json({
        countExpense: expense,
        countInventory: inventory,
        countSales: sales
    });
};
