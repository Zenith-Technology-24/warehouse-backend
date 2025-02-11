import prisma from "@/generic/prisma";
import { EndUser } from "@prisma/client";


export class EndUserService {
    async createEndUser(data: any) {
        return await prisma.endUser.create({
        data: {
            ...data,
        },
        });
    }
    
    async getEndUserById(id: string) {
        return await prisma.endUser.findUnique({
        where: {
            id,
        },
        });
    }
    
    async getEndUsers() {
        return await prisma.endUser.findMany();
    }
    
    async updateEndUser(id: string, data: any) {
        return await prisma.endUser.update({
        where: {
            id,
        },
        data: {
            ...data,
        },
        });
    }
    
    async deleteEndUser(id: string) {
        return await prisma.endUser.delete({
        where: {
            id,
        },
        });
    }
}