import { AppDataSource } from "../database/DataSource";
import { User } from "../../core/entities/User";
import { HashHelper } from "../../infrastructure/security/HashHelper";

/**
 * Enterprise User Repository
 * Encapsulates all data access logic for User entity
 */
export class UserRepository {
  private repo = AppDataSource.getRepository(User);

  async create(userData: Partial<User>): Promise<User> {
    if (userData.password) {
      userData.password = await HashHelper.hash(userData.password);
    }
    const user = this.repo.create(userData);
    return await this.repo.save(user);
  }

  async findById(id: string): Promise<User | null> {
    return await this.repo.findOneBy({ id });
  }

  async findByUsername(username: string): Promise<User | null> {
    return await this.repo.findOneBy({ username });
  }

  /**
   * Verified Authentication
   */
  async authenticate(username: string, password: string): Promise<User | null> {
    const user = await this.repo.createQueryBuilder("user")
      .addSelect("user.password") // Manually select hidden password
      .where("user.username = :username", { username })
      .getOne();

    if (user && await HashHelper.verify(user.password, password)) {
      return user;
    }
    return null;
  }
}
