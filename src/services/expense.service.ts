import moment from 'moment';
import { AppDataSource } from '../database/data-source';
import { Expense } from '../models/expense.entity';
import { Between } from 'typeorm';

interface PaginatedExpenseResponse {
    data: Expense[];
    total: number;
    currentPage: number;
    totalPages: number;
}

export class ExpenseService {
    private expenseRepository = AppDataSource.getRepository(Expense);

    async getAllExpense({ req }: any): Promise<PaginatedExpenseResponse> {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const status = req.body.status !== 'all' ? req.body.status : null;
        const searchTerm = req.body.search ? `%${req.body.search}%` : '%';

        const query = this.expenseRepository.createQueryBuilder('expense');

        if (req.body.search && status) {
            query.andWhere(
                'expense.status = :status AND (expense.first_name LIKE :searchTerm OR expense.last_name LIKE :searchTerm OR expense.expense_type LIKE :searchTerm)',
                { status, searchTerm }
            );
        } else if (req.body.search) {
            query.andWhere(
                'expense.first_name LIKE :searchTerm OR expense.last_name LIKE :searchTerm OR expense.expense_type LIKE :searchTerm',
                { searchTerm }
            );
        } else if (status) {
            query.andWhere('expense.status = :status', { status });
        }

        query.orderBy('expense.created_at', 'DESC')
            .skip(skip)
            .take(limit);

        const [data, total] = await query.getManyAndCount();

        return {
            data,
            total,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
        };
    }

    async getExportExpense({ req }: any) {
        const { search, start_date, end_date } = req.body;

        const status = req.body.status !== 'all' ? req.body.status : null;
        const searchTerm = search ? `%${search}%` : '%';

        const modifiedStartDate = end_date ? moment(start_date).startOf('day').toISOString() : null;
        const modifiedEndDate = end_date ? moment(end_date).endOf('day').toISOString() : null;

        const query = this.expenseRepository.createQueryBuilder('expense');

        if (req.body.search && status) {
            query.andWhere(
                'expense.status = :status AND (expense.first_name LIKE :searchTerm OR expense.last_name LIKE :searchTerm OR expense.expense_type LIKE :searchTerm)',
                { status, searchTerm }
            );
        } else if (req.body.search) {
            query.andWhere(
                'expense.first_name LIKE :searchTerm OR expense.last_name LIKE :searchTerm OR expense.expense_type LIKE :searchTerm',
                { searchTerm }
            );
        } else if (status) {
            query.andWhere('expense.status = :status', { status });
        }

        if (start_date && modifiedEndDate) {
            query.andWhere('expense.created_at BETWEEN :start_date AND :end_date', {
                start_date: modifiedStartDate,
                end_date: modifiedEndDate
            });
        }

        query.orderBy('expense.created_at', 'DESC')

        const data = await query.getMany();

        return data;
    }

    async createExpense(expense: Partial<Expense>): Promise<Expense> {
        const newExpense = this.expenseRepository.create(expense);
        return this.expenseRepository.save(newExpense);
    }

    async updateExpense(id: number, expense: Partial<Expense>): Promise<Expense | null> {
        const existingExpense = await this.expenseRepository.findOne({ where: { id } });

        if (!existingExpense) {
            return null;
        }
        Object.assign(existingExpense, expense);
        return this.expenseRepository.save(existingExpense);
    }

    async updateStatus(id: number, status: string): Promise<Expense | null> {
        await this.expenseRepository.update(id, { status } as any);

        const updatedExpense = await this.expenseRepository.findOne({
            where: { id }
        });
        return updatedExpense || null;
    }

    async countExpenses(): Promise<Number> {
        const todayStart = moment().startOf('day').toDate();
        const todayEnd = moment().endOf('day').toDate();

        const todayExpenses = await this.expenseRepository.find({
            where: {
                status: 'active',
                created_at: Between(todayStart, todayEnd)
            } as any
        });

        const totalAmount = todayExpenses
            .reduce((total, expense) => total + parseFloat(expense.amount as any), 0)
            .toFixed(2);

        return parseFloat(totalAmount);
    }
}
