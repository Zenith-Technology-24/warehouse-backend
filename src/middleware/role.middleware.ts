import { Request, Response, NextFunction } from "express";
import { User } from "../models/user.entity";
import { AuthService } from "../services/auth.service";
import { Role } from "../models/role.entity";

interface CustomRequest extends Request {
    user: User;
    return: (req: CustomRequest, res: Response, next: NextFunction) => void;
}

export const hasRole = (roles: string[]) => {
    return async (req: CustomRequest, res: Response, next: NextFunction) => {
        const user = await new AuthService().getUser(req.user.id);

        if (!user) {
            return res.status(403).json({ 
                message: 'No user found in request' 
            });
        }

        // Check if user has any of the required roles
        const hasRequiredRole = user.roles.some((role: Role) => 
            roles.includes(role.name)
        );

        if (!hasRequiredRole) {
            return res.status(403).json({ 
                message: 'User does not have the required role' 
            });
        }

        next();
    };
};