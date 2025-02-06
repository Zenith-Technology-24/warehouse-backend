/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
} from "typeorm";
import { Status } from "../enums/inventory.enum";
import { Issuance } from "./issuance.entity";

@Entity()
export class Inventory {
  [x: string]: any;
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  product_name!: string;

  @Column()
  category!: string;

  @Column()
  size!: string;

  @Column()
  in_stock!: number;

  @Column("decimal", { precision: 10, scale: 2 })
  cost!: number;

  @Column("decimal", { precision: 10, scale: 2 })
  price!: number;

  @Column({
    type: "enum",
    enum: Status,
    default: Status.ACTIVE,
  })
  status!: Status;

  @CreateDateColumn({ type: "timestamp" })
  created_at!: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updated_at!: Date;

  @ManyToMany(() => Issuance, issuance => issuance.inventory_items)
  issuances!: Issuance[];
}
