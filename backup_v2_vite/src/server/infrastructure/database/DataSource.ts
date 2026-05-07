import { DataSource } from "typeorm";
import { User } from "../../core/entities/User";
import { AuditLog } from "../../core/entities/AuditLog";
import { Transaction } from "../../core/entities/Transaction";
import { ChatMessage } from "../../core/entities/ChatMessage";
import { Product } from "../../core/entities/Product";
import { Notification } from "../../core/entities/Notification";

const isExternalDB = !!process.env.DATABASE_URL;

export const AppDataSource = isExternalDB 
  ? new DataSource({
      type: "postgres",
      url: process.env.DATABASE_URL,
      synchronize: true,
      logging: false,
      entities: [User, AuditLog, Transaction, ChatMessage, Product, Notification],
    })
  : new DataSource({
      type: "sqlite",
      database: "database.sqlite",
      synchronize: true,
      logging: false,
      entities: [User, AuditLog, Transaction, ChatMessage, Product, Notification],
    });
