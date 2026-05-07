import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity()
export class Notification {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("varchar")
  title: string;

  @Column("text")
  body: string;

  @Column("varchar", { default: "promo" })
  type: string;

  @CreateDateColumn()
  createdAt: Date;
}
