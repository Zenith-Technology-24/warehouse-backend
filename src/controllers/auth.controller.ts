/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { plainToInstance } from 'class-transformer';
import { User } from '../models/user.entity';

const authService = new AuthService();

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const user = await authService.validateUser(email, password);
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const userWithoutPassword = plainToInstance(User, user);
        const token = await authService.login(user);
        res.status(200).json({
            user: userWithoutPassword,
            token
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const session = async (req: any, res: Response) => {
    const user = await authService.getUser(Number(req.user.id))
    res.status(200).json({
        ...user,
        data: req.user
    });
};
