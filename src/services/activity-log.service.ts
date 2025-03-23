import prisma from "@/generic/prisma";
import { ActivityLog, User } from "@prisma/client";

interface CreateActivityLogDto {
    activity: string;
    performedById: string
}

export class ActivityLogService {
    async create(data: CreateActivityLogDto) : Promise<ActivityLog | { message: string }> {
        try {
            const activityLog = await prisma.$transaction(async (tx) => {
                return tx.activityLog.create({
                    data: {
                        date: new Date().toISOString(),
                        activity: data.activity,
                        performedById: data.performedById
                    }
                })
            })

            return activityLog
        }catch (error) {
            console.error('Error creating activity log: ', error);
            return { message: `Failed to create activity log: ${error}` };            
        }
    }

    async get(
        page = 1,
        pageSize = 10,
        search?: string,
        date?: string,
        userId?: string,
    ) {
        try {
            const skip = (page - 1) * pageSize;

            let dateFilter = {};

            if (date) {
                const [year, month, day] = date.split("-").map(Number);
                
                if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
                    const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0)).toISOString();
                    const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999)).toISOString();
    
                    dateFilter = { date: { gte: startOfDay, lt: endOfDay } };
                }
            }
            
            const whereCondition = {
                ...(search && {
                    OR: [
                        {
                            activity: {
                                contains: search,
                                mode: 'insensitive'
                            },
                        },
                        {
                            performedBy: {
                                is: {
                                    username: {
                                        contains: search,
                                        mode: 'insensitive'
                                    }
                                }
                            }
                        }
                    ]
                }),
                ...(userId && { performedById: userId }),
                ...dateFilter
            };

            

            const [activityLogs, totalCount] = await Promise.all([
                prisma.activityLog.findMany({
                    where: whereCondition as any,
                    take: pageSize,
                    skip: skip,
                    orderBy: {
                        date: "desc"
                    },
                    select: {
                        activity: true,
                        date: true,
                        performedBy: {
                            select: {
                                username: true,
                                roles: true
                            }
                        }
                    }
                }),
                prisma.activityLog.count({ where: whereCondition as any})
            ])

            return {
                data: activityLogs,
                total: totalCount,
                currentPage: page,
                totalPages: Math.ceil(totalCount / pageSize),
            }
        } catch (error) {
            console.error("error fetching activity logs", error);
            throw error;
        }
    }

    async export (
        start_date: string,
        end_date: string,
        search?: string
    ) {
        try {

            const whereCondition = {
                date: {
                    gte: start_date,
                    lte: end_date
                },
                ...(search
                    ? {
                          OR: [
                              { activity: { contains: search, mode: "insensitive" } },
                              { performedBy: { username: { contains: search, mode: "insensitive" } } }
                          ]
                      }
                    : {})
            };

            const activityLogs = await prisma.activityLog.findMany({
                where: whereCondition as any,
                orderBy: {
                    date: "desc"
                },
                select: {
                    id: true,
                    activity: true,
                    date: true,
                    performedBy: {
                        select: {
                            username: true,
                            roles: true
                        }
                    }
                }
            }) 

            return activityLogs
        } catch (error) {
            console.error("error fetching activity logs", error);
            throw error;
        }
    }
    
}