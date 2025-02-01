import { SalesInventory } from './../models/sales_inventories.entity';
import moment from 'moment';
import { AppDataSource } from '../database/data-source';
import { Sales } from '../models/sales.entity';

interface PaginatedSalesResponse {
    data: Sales[];
    total: number;
    currentPage: number;
    totalPages: number;
}

export class SalesService {
    private salesRepository = AppDataSource.getRepository(Sales);

    async getAllSales({ req }: any): Promise<PaginatedSalesResponse> {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const status = req.body.status !== 'all' ? req.body.status : null;
        const searchTerm = req.body.search ? `%${req.body.search}%` : '%';

        const query = this.salesRepository.createQueryBuilder('sales')
            .leftJoinAndSelect('sales.customer', 'customer')
            .leftJoinAndSelect('sales.salesInventory', 'salesInventory')
            .leftJoinAndSelect('salesInventory.inventory', 'inventory')

        if (req.body.search && status) {
            query.andWhere(
                'sales.status = :status AND (customer.first_name LIKE :searchTerm OR customer.last_name LIKE :searchTerm OR customer.address LIKE :searchTerm)',
                { status, searchTerm }
            );
        } else if (req.body.search) {
            query.andWhere(
                'customer.first_name LIKE :searchTerm OR customer.last_name LIKE :searchTerm OR customer.address LIKE :searchTerm',
                { searchTerm }
            );
        } else if (status) {
            query.andWhere('sales.status = :status', { status });
        }

        query.orderBy('sales.created_at', 'DESC')
            .skip(skip)
            .take(limit);

        const [data, total] = await query.getManyAndCount();

        const processedData = data.map((sale) => {
            const modifiedSalesInventory = sale.salesInventory.map((inventoryItem) => {
                const terms = parseInt(inventoryItem.terms);
                const dueDate = moment(inventoryItem.created_at).add(terms, 'days').toDate();

                return {
                    ...inventoryItem,
                    due_date: dueDate
                };
            });

            return {
                ...sale,
                salesInventory: modifiedSalesInventory
            };
        });

        return {
            data: processedData,
            total,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
        };
    }

    async getExportSales({ req }: any) {
        const { search, start_date, end_date } = req.body;

        const status = req.body.status !== 'all' ? req.body.status : null;
        const searchTerm = req.body.search ? `%${req.body.search}%` : '%';

        const modifiedStartDate = end_date ? moment(start_date).startOf('day').toISOString() : null;
        const modifiedEndDate = end_date ? moment(end_date).endOf('day').toISOString() : null;

        const query = this.salesRepository.createQueryBuilder('sales')
            .leftJoinAndSelect('sales.customer', 'customer')
            .leftJoinAndSelect('sales.salesInventory', 'salesInventory')
            .leftJoinAndSelect('salesInventory.inventory', 'inventory')

        if (req.body.search && status) {
            query.andWhere(
                'sales.status = :status AND (customer.first_name LIKE :searchTerm OR customer.last_name LIKE :searchTerm OR customer.address LIKE :searchTerm)',
                { status, searchTerm }
            );
        } else if (req.body.search) {
            query.andWhere(
                'customer.first_name LIKE :searchTerm OR customer.last_name LIKE :searchTerm OR customer.address LIKE :searchTerm',
                { searchTerm }
            );
        } else if (status) {
            query.andWhere('sales.status = :status', { status });
        }

        if (start_date && modifiedEndDate) {
            query.andWhere('sales.created_at BETWEEN :start_date AND :end_date', {
                start_date: modifiedStartDate,
                end_date: modifiedEndDate
            });

            query.orderBy('sales.created_at', 'DESC');

            const data = await query.getMany();

            const processedData = data.map((sale) => {
                const modifiedSalesInventory = sale.salesInventory.map((inventoryItem) => {
                    const terms = parseInt(inventoryItem.terms);
                    const dueDate = moment(inventoryItem.created_at).add(terms, 'days').toDate();

                    return {
                        ...inventoryItem,
                        due_date: dueDate
                    };
                });

                return {
                    ...sale,
                    salesInventory: modifiedSalesInventory
                };
            });

            return processedData;
        }
    }

    async getSales(id: number): Promise<Sales | null> {
        const sales = await this.salesRepository.findOne({
            where: { id },
            relations: {
                salesInventory: {
                    inventory: true,
                },
                customer: true
            }
        });
        if (!sales) {
            return null;
        }

        // @ts-ignore to bypass type error
        const total = sales.salesInventory.reduce((acc, item) => acc + Number.parseFloat(item.total_price), 0);

        // @ts-ignore to bypass type error for attaching custom field
        sales.total = total;

        return sales;
    }

    async createSales(sales: Partial<Sales>): Promise<Sales> {
        const newSales = this.salesRepository.create(sales);
        return this.salesRepository.save(newSales);
    }

    async updateSales(id: number, sales: Partial<Sales>): Promise<Sales | null> {
        const existingSales = await this.salesRepository.findOne({ where: { id } });

        if (!existingSales) {
            return null;
        }
        Object.assign(existingSales, sales);
        return this.salesRepository.save(existingSales);
    }

    async deleteSales(id: number): Promise<boolean> {
        const result = await this.salesRepository.delete(id);
        return result.affected !== 0;
    }

    async updateStatus(id: number, status: string): Promise<Sales | null> {
        await this.salesRepository.update(id, { status } as any);

        const updatedSales = await this.salesRepository.findOne({
            where: { id }
        });
        return updatedSales || null;
    }
}
