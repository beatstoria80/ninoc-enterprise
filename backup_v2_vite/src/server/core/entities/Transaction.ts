import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from "typeorm";
import { User } from "./User";

export enum TransactionStatus {
  PENDING = "PENDING",
  SETTLED = "SETTLED", // Payment successfully received
  EXPIRED = "EXPIRED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED"
}

@Entity("transactions")
export class Transaction {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("varchar")
  orderId!: string; // Internal order ID or Midtrans order_id

  @Column("decimal", { precision: 12, scale: 2 })
  amount!: number;

  @Column("varchar", {
    default: TransactionStatus.PENDING
  })
  status!: TransactionStatus;

  @Column("varchar", { nullable: true })
  paymentType?: string; // qris, gopay, bank_transfer, etc.

  @Column("simple-json", { nullable: true })
  paymentDetails?: any;

  @Column("varchar", { nullable: true })
  customerEmail?: string;

  @Column("simple-json", { nullable: true })
  metadata?: any;

  @Column("varchar", { default: "IDR" })
  currency!: string;

  @Column("uuid", { nullable: true })
  userId?: string;

  @ManyToOne(() => User, { nullable: true })
  user?: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
