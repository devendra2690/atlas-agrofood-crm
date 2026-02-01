"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { logActivity } from "./audit";

export async function deleteUser(userId: string) {
    try {
        const session = await auth();
        // @ts-ignore
        if (session?.user?.role !== 'ADMIN') {
            return { success: false, error: "Unauthorized: Admin access required" };
        }

        if (session.user.id === userId) {
            return { success: false, error: "You cannot delete yourself." };
        }

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            return { success: false, error: "User not found" };
        }

        // Perform hard delete
        await prisma.user.delete({
            where: { id: userId }
        });

        await logActivity({
            action: "DELETE",
            entityType: "User",
            entityId: userId,
            details: `Deleted user ${user.name || user.email}`
        });

        revalidatePath("/settings/team");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete user:", error);
        // @ts-ignore
        if (error.code === 'P2003') { // Foreign key constraint failed
            return { success: false, error: "Cannot delete user because they have associated records (e.g. Orders, Companies). Please reassign or delete those records first." };
        }
        return { success: false, error: "Failed to delete user" };
    }
}

export async function getUsers() {
    try {
        const users = await prisma.user.findMany({
            orderBy: { name: 'asc' },
            select: { id: true, name: true, email: true }
        });
        return { success: true, data: users };
    } catch (error) {
        console.error("Failed to fetch users:", error);
        return { success: false, error: "Failed to fetch users" };
    }
}
