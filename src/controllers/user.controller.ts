/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';
import { UserService } from '../services/user.service';

const userService = new UserService();

export const createUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const userData = req.body;
        const newUser = await userService.createUser(userData);
        
        res.status(201).json({
            message: "User created successfully",
            user: newUser
        });
    } catch (error: any) {
        res.status(500).json({ 
            message: error.message || "Failed to create user"
        });
    }
};


export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        const users = await userService.getAllUsers();
        res.status(200).json(users);
    } catch (error: any) {
        res.status(500).json({ message: "Something went wrong: " + error });
    }
};

export const updateUser = async (req: any, res: Response): Promise<void> => {
    try {
        const updatedUser = await userService.updateUser(Number(req.user.id), req.body);
        if (updatedUser) {
            res.status(200).json({ message: "User update successfully" });
        } else {
            res.status(404).json({ message: "User not found" });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}
