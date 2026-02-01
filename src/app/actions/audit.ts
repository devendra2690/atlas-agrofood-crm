'use server'

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export type ActivityLogType = {
    action: string;
    entityType: string;
    entityId: string;
    entityTitle?: string;
    details?: string;
};

export async function logActivity(data: ActivityLogType) {
    try {
        const session = await auth();
        // If no user session, we might be seeding or system action.
        // We can fetch a system user or skip. For now, let's try to get a user.
        let userId = session?.user?.id;

        if (!userId) {
            // Fallback for system actions (e.g. seeding)
            const sysUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
            userId = sysUser?.id;
        }

        if (!userId) {
            console.warn("No user found for activity log, skipping:", data);
            return;
        }

        await prisma.activityLog.create({
            data: {
                action: data.action,
                entityType: data.entityType,
                entityId: data.entityId,
                entityTitle: data.entityTitle,
                details: data.details,
                userId: userId
            }
        });
    } catch (error) {
        console.error("Failed to log activity:", error);
        // Don't throw, we don't want to break the main flow if logging fails
    }
}

export async function getActivities(filters?: {
    page?: number;
    limit?: number;
    entityType?: string;
    userId?: string;
    query?: string;
}) {
    try {
        const page = filters?.page || 1;
        const limit = filters?.limit || 20;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (filters?.entityType && filters.entityType !== 'all') {
            where.entityType = filters.entityType;
        }

        if (filters?.userId && filters.userId !== 'all') {
            where.userId = filters.userId;
        }

        if (filters?.query) {
            const search = filters.query.trim();
            where.OR = [
                { entityId: { contains: search, mode: 'insensitive' } },
                { entityTitle: { contains: search, mode: 'insensitive' } },
                { details: { contains: search, mode: 'insensitive' } }
            ];
        }

        const [activities, total] = await prisma.$transaction([
            prisma.activityLog.findMany({
                where,
                take: limit,
                skip,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: { name: true, image: true }
                    }
                }
            }),
            prisma.activityLog.count({ where })
        ]);

        return {
            success: true,
            data: activities,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    } catch (error) {
        console.error("Failed to fetch activities:", error);
        return { success: false, error: "Failed to fetch activities" };
    }
}
