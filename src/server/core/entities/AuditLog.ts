import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity("audit_logs")
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("varchar")
  action: string; 

  @Column("simple-json", { nullable: true })
  metadata: any; 

  @Column("varchar", { nullable: true })
  ipAddress: string;

  @CreateDateColumn()
  timestamp: Date;
}
