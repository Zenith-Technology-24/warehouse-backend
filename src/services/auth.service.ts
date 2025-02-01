import { AppDataSource } from "../database/data-source";
import { User } from "../models/user.entity";
import * as bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";

export class AuthService {
  private userRepository = AppDataSource.getRepository(User);

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findOneBy({ email });
    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }
    return null;
  }

  async login(user: User): Promise<string> {
    const payload = {
      id: user.id,
      email: user.email,
      firstname: user.firstname,
      lastname: user.lastname,
    };
    return jwt.sign(payload, process.env.JWT_SECRET as string, {
      expiresIn: "1h",
    });
  }

  async getUser(id: number): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ["roles"],
    });

    if (!user) {
      return null;
    }
    return user;
  }
}
