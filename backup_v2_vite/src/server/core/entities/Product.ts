import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("products")
export class Product {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("varchar")
  name: string;

  @Column("varchar", { unique: true, nullable: true })
  sku: string;

  @Column("varchar", { default: "active" })
  status: string; // active | draft | archived

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column("decimal", { precision: 12, scale: 2, default: 0 })
  hpp: number;

  @Column("decimal", { precision: 12, scale: 2, nullable: true })
  originalPrice: number;

  @Column("varchar", { nullable: true })
  discountTag: string; // e.g., "30%"

  @Column("decimal", { precision: 12, scale: 2, default: 0 })
  taxAmount: number; // PPH

  @Column("decimal", { precision: 12, scale: 2, default: 0 })
  feeAmount: number; // Admin fees

  @Column("decimal", { precision: 12, scale: 2, default: 0 })
  netMargin: number; // Market Value - HPP - Tax - fees

  @Column("decimal", { precision: 12, scale: 2 })
  price: number;

  @Column("varchar")
  category: string;

  @Column({ type: "text" })
  description: string;

  @Column("varchar", { nullable: true })
  material: string;

  @Column("text", { nullable: true })
  image: string;

  @Column("text", { nullable: true })
  perspective1: string;

  @Column("text", { nullable: true })
  perspective2: string;

  @Column("text", { nullable: true })
  perspective3: string;

  @Column("text", { nullable: true })
  perspective4: string;

  @Column("simple-array", { nullable: true })
  additionalImages: string[];

  @Column("varchar", { default: "#F5F5F5" })
  bg: string;

  @Column("int", { default: 0 })
  stock: number;

  @Column("boolean", { default: false })
  featured: boolean;

  @Column("boolean", { default: false })
  isPKP: boolean;

  @Column("simple-array", { nullable: true })
  sizes: string[];
}
