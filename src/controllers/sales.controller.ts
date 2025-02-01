import { Inventory } from './../models/inventory.entity';
import { SalesInventory } from './../models/sales_inventories.entity';
import { SalesInventoryService } from './../services/salesInventory.service';
import { InventoryService } from './../services/inventory.service';
import { Request, Response } from 'express';
import { SalesService } from '../services/sales.service';
import { CustomerService } from '../services/customer.service';
import { Status } from '../enums/sales.enum';

const salesService = new SalesService()
const customerService = new CustomerService()
const salesInventoryService = new SalesInventoryService()
const inventoryService = new InventoryService()

export const getAllSales = async (req: Request, res: Response) => {
    try {
        const sales = await salesService.getAllSales({ req });
        res.status(200).json(sales);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getExportSales = async (req: Request, res: Response) => {
    try {
        const sales = await salesService.getExportSales({ req });
        res.status(200).json(sales);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getSales = async (req: Request, res: Response) => {
    try {
        const sales = await salesService.getSales(Number(req.params.id))
        res.status(200).json(sales);
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}

export const createSales = async (req: Request, res: Response) => {
    try {
        const customerData = {
            first_name: req.body.customer_firstname,
            last_name: req.body.customer_lastname,
            contact_number: req.body.customer_contactnumber,
            address: req.body.customer_address
        }
        const customer = req.body.customer_id ? await customerService.getCustomer(Number(req.body.customer_id)) : await customerService.createCustomer(customerData)
        const salesData = {
            customer: customer
        }
        const sales = await salesService.createSales(salesData as any)

        let salesInventoryTemp = [] as any
        try {
            await Promise.all(
                req.body.inventories.map(async (inv: Partial<SalesInventory>) => {
                    const inventory = await inventoryService.getInventory(Number(inv.id));
                    if (inventory) {
                        if (inventory.in_stock >= Number(inv.quantity)) {
                            inventory.in_stock -= inv.quantity as number;
                            await inventoryService.updateInventory(inventory.id, inventory);
                            const salesInventory = await salesInventoryService.createSalesInventory({
                                quantity: inv.quantity,
                                total_price: inv.total_price,
                                terms: inv.terms,
                                inventory: inventory as any,
                                sales: sales
                            });
                            salesInventoryTemp = [...salesInventoryTemp, {
                                id: salesInventory.id,
                                quantity: inv.quantity,
                                inventory: inventory
                            }];
                        } else {
                            throw new Error(`Not enough ${inventory.product_name} stock.`);
                        }
                    }
                })
            );
        } catch (error: any) {
            salesService.deleteSales(Number(sales.id));
            salesInventoryTemp.forEach((si: { id: number, quantity: number, inventory: Inventory }) => {
                salesInventoryService.deleteSalesInventory(Number(si.id));
                inventoryService.updateInventory(si.inventory.id, si.inventory);
            });
            if (!req.body.customer_id) {
                customerService.deleteCustomer(Number(customer?.id));
            }
            console.error(error.message);
            throw error;
        }

        res.status(201).json(sales)
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}

export const updateSales = async (req: Request, res: Response): Promise<void> => {
    try {
        try {
            const customerData = {
                first_name: req.body.customer_firstname,
                last_name: req.body.customer_lastname,
                contact_number: req.body.customer_contactnumber,
                address: req.body.customer_address
            }
            const sales = await salesService.getSales(Number(req.body.id)) as any
            const customer = req.body.customer_name ? await customerService.getCustomer(Number(req.body.customer_id)) : await customerService.updateCustomer(Number(req.body.customer_id), customerData)
            if (req.body.customer_id) {
                await salesService.updateSales(Number(req.body.id), { ...sales, customer: customer })
            }
            await Promise.all(
                req.body.inventories.map(async (inv: any) => {
                    if (inv.created_at) {
                        const salesInventory = await salesInventoryService.getSalesInventory(Number(inv.id))
                        const inventory = await inventoryService.getInventory(Number(inv.inventory.id))

                        if (inventory && salesInventory) {
                            if (inv.quantity < salesInventory.quantity) {
                                inventory.in_stock = Math.abs(inv.quantity - salesInventory.quantity) + inventory.in_stock
                            } else {
                                inventory.in_stock = Math.abs(Math.abs(inv.quantity - salesInventory.quantity) - inventory.in_stock)
                            }

                            if (inv.inventory.product_name !== inventory.product_name) {
                                salesInventory.inventory.in_stock = salesInventory.inventory.in_stock + salesInventory.quantity
                                inventory.in_stock = Math.abs(inventory.in_stock - salesInventory.quantity)
                                await inventoryService.updateInventory(Number(salesInventory.inventory.id), salesInventory.inventory)
                                await inventoryService.updateInventory(Number(inventory.id), inventory)
                            } else {
                                await inventoryService.updateInventory(Number(inv.inventory.id), inventory)
                            }

                            await salesInventoryService.updateSalesInventory(Number(inv.id), inv)
                        }
                    } else {
                        const inventory = await inventoryService.getInventory(Number(inv.inventory.id));
                        if (inventory) {
                            if (inventory.in_stock >= Number(inv.quantity)) {
                                inventory.in_stock -= inv.quantity as number;
                                await inventoryService.updateInventory(inventory.id, inventory);
                                const salesInventory = await salesInventoryService.createSalesInventory({
                                    quantity: inv.quantity,
                                    total_price: inv.total_price,
                                    terms: inv.terms,
                                    inventory: inventory as any,
                                    sales
                                });
                            } else {
                                throw new Error(`Not enough ${inventory.product_name} stock.`);
                            }
                        }
                    }
                })
            );
            const notMatched = sales.salesInventory?.filter((si: { id: number }) =>
                !req.body.inventories.some((inv: any) => inv.id === si.id || !inv.created_at)
            );
            notMatched.map(async (e: { id: number, inventory_id: number, quantity: number, inventory: any }) => {
                await salesInventoryService.deleteSalesInventory(Number(e.id))
                const inventory = await inventoryService.getInventory(Number(e.inventory.id))
                if (inventory) {
                    inventory.in_stock = e.quantity + inventory.in_stock
                    await inventoryService.updateInventory(Number(inventory.id), inventory)
                }
            })
        } catch (error: any) {
            console.log(error)
            console.error(error.message);
            throw error;
        }

        res.status(201).json('success')
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}

export const updateStatusSales = async (req: Request, res: Response): Promise<void> => {
    if (!Object.values(Status).includes(req.params.status as Status)) {
        res.status(400).json({ message: `Invalid status value. Allowed values are: ${Object.values(Status).join(', ')}` });
        return;
    }

    const updatedSales = await salesService.updateStatus(Number(req.params.id), req.params.status);
    if (updatedSales) {
        res.json({
            sales: updatedSales,
            message: "Sales status updated successfully"
        });
    } else {
        res.status(404).json({ message: "Sales not found" });
    }
}

export const deleteSalesProduct = async (req: Request, res: Response): Promise<void> => {
    const success = await salesInventoryService.deleteSalesInventory(Number(req.params.id))
    if (success) {
        res.status(200).json({ message: "Product deleted successfully" });
    } else {
        res.status(404).json({ message: "Product not found" });
    }
}