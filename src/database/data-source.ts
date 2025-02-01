import { DataSource } from 'typeorm';
import { User } from '../models/user.entity';
import 'dotenv/config';
import { Inventory } from '../models/inventory.entity';
import { Sales } from '../models/sales.entity';
import { Customer } from '../models/customer.entity';
import { SalesInventory } from '../models/sales_inventories.entity';
import { Expense } from '../models/expense.entity';
import { Role } from '../models/role.entity';

export const AppDataSource = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: [User, Inventory, Sales, Customer, SalesInventory, Expense, Role],
    synchronize: true,
    logging: true,
});
