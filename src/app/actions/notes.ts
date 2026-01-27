"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { TodoPriority, TodoStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

// --- Types ---
export type CreateTodoData = {
    content: string;
    priority?: TodoPriority;
    dueDate?: Date;
};

export type UpdateTodoData = {
    content?: string;
    status?: TodoStatus;
    priority?: TodoPriority;
    dueDate?: Date | null;
};

// --- Actions ---

export async function createTodo(data: CreateTodoData) {
    try {
        const session = await auth();
        let userId = session?.user?.id;

        // Verify user exists or fallback
        if (userId) {
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user) userId = undefined;
        }

        if (!userId) {
            const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
            if (admin) userId = admin.id;
        }

        if (!userId) {
            return { success: false, error: "No valid user found to create note" };
        }

        const todo = await prisma.todo.create({
            data: {
                content: data.content,
                priority: data.priority || "MEDIUM",
                status: "PENDING",
                dueDate: data.dueDate,
                userId: userId
            }
        });

        revalidatePath("/notes");
        return { success: true, data: todo };
    } catch (error) {
        console.error("Failed to create todo:", error);
        return { success: false, error: "Failed to create note" };
    }
}

export async function updateTodo(id: string, data: UpdateTodoData) {
    try {
        await prisma.todo.update({
            where: { id },
            data: {
                content: data.content,
                status: data.status,
                priority: data.priority,
                dueDate: data.dueDate
            }
        });

        revalidatePath("/notes");
        return { success: true };
    } catch (error) {
        console.error("Failed to update todo:", error);
        return { success: false, error: "Failed to update note" };
    }
}

export async function deleteTodo(id: string) {
    try {
        await prisma.todo.delete({
            where: { id }
        });

        revalidatePath("/notes");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete todo:", error);
        return { success: false, error: "Failed to delete note" };
    }
}

export async function getTodos(filters?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    priority?: string;
}) {
    try {
        const page = filters?.page || 1;
        const limit = filters?.limit || 20;
        const skip = (page - 1) * limit;

        const where: any = {};

        if (filters?.search) {
            where.content = { contains: filters.search, mode: "insensitive" };
        }

        if (filters?.status && filters.status !== 'all') {
            where.status = filters.status;
        }

        if (filters?.priority && filters.priority !== 'all') {
            where.priority = filters.priority;
        }

        const [todos, total] = await prisma.$transaction([
            prisma.todo.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: {
                    user: {
                        select: { name: true, image: true }
                    }
                }
            }),
            prisma.todo.count({ where })
        ]);

        return {
            success: true,
            data: todos,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    } catch (error) {
        console.error("Failed to get todos:", error);
        return { success: false, error: "Failed to load notes" };
    }
}
