import { Request, Response } from 'express';
import { CustomerService } from '../services/customer.service';

const customerService = new CustomerService();

export const getAllCustomer = async (req: Request, res: Response) => {
    try {
        const customers = await customerService.getAllCustomer();
        res.status(200).json(customers);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};