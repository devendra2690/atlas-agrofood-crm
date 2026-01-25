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

export async function getInteractions() {
    try {
        const interactions = await prisma.interactionLog.findMany({
            orderBy: { date: 'desc' },
            include: {
                company: true,
                user: true
            }
        });
        return { success: true, data: interactions };
    } catch (error) {
        console.error("Failed to get interactions:", error);
        return { success: false, error: "Failed to fetch interactions" };
    }
}
