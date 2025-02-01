import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Status } from '../enums/expense.enum';

@Entity()
export class Expense {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    expense_type!: string;

    @Column("decimal", { precision: 10, scale: 2 })
    amount!: number;

    @Column()
    first_name!: string;

    @Column()
    last_name!: string;

    @Column()
    description!: string;

    @Column({
        type: 'enum',
        enum: Status,
        default: Status.ACTIVE,
    })
    status!: Status;

    @CreateDateColumn({ type: 'timestamp' })
    created_at!: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updated_at!: Date;
}
