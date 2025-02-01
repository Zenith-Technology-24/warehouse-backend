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
    type: 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    database: process.env.PG_DB,
    entities: [User, Inventory, Sales, Customer, SalesInventory, Expense, Role],
    synchronize: true,
    logging: true,
});
