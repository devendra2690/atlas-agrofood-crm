'use server'

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type InteractionFormData = {
    companyId: string;
    description: string;
    date?: Date;
    nextFollowUp?: Date;
    status?: "FOLLOW_UP_SCHEDULED" | "CLOSED";
};

// TODO: In a real app, we would get the logged-in user's ID from the session.
// For now, we'll fetch the first user or create a dummy one if none exists.
async function getSystemUserId() {
    const user = await prisma.user.findFirst();
    if (user) return user.id;

    const newUser = await prisma.user.create({
        data: {
            name: "System User",
            email: "system@atlasagro.com",
            role: "ADMIN"
        }
    });
    return newUser.id;
}

export async function logInteraction(data: InteractionFormData) {
    try {
        const userId = await getSystemUserId();

        const interaction = await prisma.interactionLog.create({
            data: {
                companyId: data.companyId,
                userId: userId,
                description: data.description,
                date: data.date || new Date(),
                nextFollowUp: data.nextFollowUp,
                status: data.status || "FOLLOW_UP_SCHEDULED"
            }
        });

        revalidatePath(`/companies/${data.companyId}`);
        return { success: true, data: interaction };
    } catch (error) {
        console.error("Failed to log interaction:", error);
        return { success: false, error: "Failed to log interaction" };
    }
}

export async function getInteractions(filters?: {
    page?: number;
    limit?: number;
    query?: string;
    status?: string;
    date?: string;
}) {
    try {
        const page = filters?.page || 1;
        const limit = filters?.limit || 10;
        const skip = (page - 1) * limit;

        const where: any = {};

        if (filters?.query) {
            const search = filters.query.trim();
            where.OR = [
                { description: { contains: search, mode: 'insensitive' } },
                {
                    company: {
                        name: { contains: search, mode: 'insensitive' }
                    }
                }
            ];
        }

        if (filters?.status && filters.status !== 'all') {
            where.status = filters.status;
        }

        if (filters?.date) {
            const date = new Date(filters.date);
            if (!isNaN(date.getTime())) {
                const startOfDay = new Date(date);
                startOfDay.setHours(0, 0, 0, 0);
                const endOfDay = new Date(date);
                endOfDay.setHours(23, 59, 59, 999);
                where.date = {
                    gte: startOfDay,
                    lte: endOfDay
                };
            }
        }

        const [interactions, total] = await prisma.$transaction([
            prisma.interactionLog.findMany({
                where,
                orderBy: { date: 'desc' },
                skip,
                take: limit,
                include: {
                    company: true,
                    user: true,
                    createdBy: { select: { name: true } },
                    updatedBy: { select: { name: true } }
                }
            }),
            prisma.interactionLog.count({ where })
        ]);

        return {
            success: true,
            data: interactions,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    } catch (error) {
        console.error("Failed to get interactions:", error);
        return { success: false, error: "Failed to fetch interactions" };
    }
}
