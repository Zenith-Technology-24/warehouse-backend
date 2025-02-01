import { AppDataSource } from '../database/data-source';
import { User } from '../models/user.entity';
import * as bcrypt from 'bcrypt';

export class UserService {
    private userRepository = AppDataSource.getRepository(User);

    async getAllUsers(): Promise<User[]> {
        return await this.userRepository.find();
    }

    async createUser(userData: Partial<User>): Promise<User> {
        
        if (!userData.email || !userData.password) {
            throw new Error('Email and password are required');
        }

        const existingUser = await this.userRepository.findOne({ 
            where: { email: userData.email } 
        });

        if (existingUser) {
            throw new Error('User with this email already exists');
        }

        const user = this.userRepository.create({
            ...userData,
        });

        return await this.userRepository.save(user);
    }


    async updateUser(id: number, user: any): Promise<User | null> {
        const existingUser = await this.userRepository.findOne({ where: { id } }) as any;
        if (!existingUser) {
            return null;
        }
        existingUser.firstname = user.firstname;
        existingUser.lastname = user.lastname;
        existingUser.email = user.email;

        if (user.current_password && user.new_password && user.confirm_password) {
            const isCurrentPasswordCorrect = await bcrypt.compare(user.current_password, existingUser.password);
            if (!isCurrentPasswordCorrect) {
                throw new Error('Current password is incorrect');
            }

            if (user.new_password !== user.confirm_password) {
                throw new Error('New password and confirm password do not match');
            }

            const hashedNewPassword = await bcrypt.hash(user.new_password, 10);
            existingUser.password = hashedNewPassword;
        }

        Object.assign(existingUser, user);

        return this.userRepository.save(existingUser);
    }
}
