import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { PIIEncryptionTransformer } from "../../infrastructure/security/EncryptionHelper";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("varchar", { unique: true })
  username!: string;

  @Column("varchar", { select: false }) // Password hidden by default in queries
  password!: string;

  @Column("varchar", { 
    transformer: new PIIEncryptionTransformer() 
  })
  email!: string;

  @Column("varchar", { 
    nullable: true,
    transformer: new PIIEncryptionTransformer() 
  })
  phoneNumber?: string;

  @Column("varchar", { nullable: true })
  displayName?: string;

  @Column("varchar", { nullable: true })
  gender?: string;

  @Column("varchar", { nullable: true })
  birthDate?: string;

  @Column("simple-json", { nullable: true })
  address?: {
    province: { id: string; name: string };
    city: { id: string; name: string };
    district: { id: string; name: string };
    village: { id: string; name: string };
    street: string;
  };

  @Column("varchar", { default: "USER" })
  role!: string;

  @Column("boolean", { default: false })
  isConsentAccepted!: boolean;

  @Column("datetime", { nullable: true })
  consentTimestamp?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  /**
   * Enterprise Data Masking logic
   * Returns a sanitized version of the user object for API responses
   */
  public toMasked(): Partial<User> {
    return {
      id: this.id,
      username: this.username,
      email: this.email, // Returning full email for owner in this internal app logic
      displayName: this.displayName,
      phoneNumber: this.phoneNumber,
      gender: this.gender,
      birthDate: this.birthDate,
      address: this.address,
      role: this.role,
      createdAt: this.createdAt
    };
  }

  private maskEmail(email: string): string {
    const [user, domain] = email.split('@');
    if (!domain) return "****";
    const maskedUser = user.length > 2 ? `${user.substring(0, 2)}***` : "***";
    const [domainBase, tld] = domain.split('.');
    const maskedDomain = domainBase.length > 2 ? `${domainBase.substring(0, 2)}***` : "***";
    return `${maskedUser}@${maskedDomain}.${tld}`;
  }

  private maskPhone(phone: string): string {
    return phone.replace(/(\d{3})\d+(\d{4})/, "$1****$2");
  }
}
