"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { TodoPriority, TodoStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

// --- Types ---
export type CreateTodoData = {
    content: string;
    priority?: TodoPriority;
};

export type UpdateTodoData = {
    content?: string;
    status?: TodoStatus;
    priority?: TodoPriority;
};

// --- Actions ---

export async function createTodo(data: CreateTodoData) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const todo = await prisma.todo.create({
            data: {
                content: data.content,
                priority: data.priority || "MEDIUM",
                status: "PENDING",
                userId: session.user.id
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
                priority: data.priority
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
