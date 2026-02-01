"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { TodoPriority, TodoStatus, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

// --- Types ---
export type CreateTodoData = {
    content: string;
    priority?: TodoPriority;
    dueDate?: Date;
    taggedUserIds?: string[];
};

export type UpdateTodoData = {
    content?: string;
    status?: TodoStatus;
    priority?: TodoPriority;
    dueDate?: Date | null;
};

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

        const todo = await prisma.$transaction(async (tx: any) => {
            // Create Note
            const newTodo = await tx.todo.create({
                data: {
                    content: data.content,
                    priority: data.priority || "MEDIUM",
                    status: "PENDING",
                    dueDate: data.dueDate,
                    userId: userId!
                }
            });

            // Create Notifications for tagged users
            if (data.taggedUserIds && data.taggedUserIds.length > 0) {
                // Determine creator name
                const creator = await tx.user.findUnique({
                    where: { id: userId },
                    select: { name: true }
                });
                const creatorName = creator?.name || "Someone";

                await tx.notification.createMany({
                    data: data.taggedUserIds.map(taggedId => ({
                        userId: taggedId,
                        title: "You were tagged in a note",
                        message: `${creatorName} tagged you: "${data.content.substring(0, 50)}${data.content.length > 50 ? '...' : ''}"`,
                        link: "/notes"
                    }))
                });
            }

            return newTodo;
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

export async function createReply(noteId: string, content: string, taggedUserIds: string[] = []) {
    try {
        const session = await auth();
        let userId = session?.user?.id;

        if (userId) {
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user) userId = undefined;
        }

        if (!userId) {
            const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
            if (admin) userId = admin.id;
        }

        if (!userId) {
            return { success: false, error: "No valid user found to reply" };
        }

        const reply = await prisma.$transaction(async (tx: any) => {
            const newReply = await tx.noteReply.create({
                data: {
                    content,
                    todoId: noteId,
                    userId: userId!
                },
                include: {
                    user: {
                        select: { name: true, image: true }
                    }
                }
            });

            // Create Notifications for tagged users
            if (taggedUserIds && taggedUserIds.length > 0) {
                // Determine creator name
                const creator = await tx.user.findUnique({
                    where: { id: userId },
                    select: { name: true }
                });
                const creatorName = creator?.name || "Someone";

                await tx.notification.createMany({
                    data: taggedUserIds.map(taggedId => ({
                        userId: taggedId,
                        title: "New reply to a note",
                        message: `${creatorName} replied and tagged you: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`,
                        link: "/notes"
                    }))
                });
            }

            return newReply;
        });

        revalidatePath("/notes");
        return { success: true, data: reply };

    } catch (error) {
        console.error("Failed to create reply:", error);
        return { success: false, error: "Failed to create reply" };
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
                    },
                    replies: {
                        include: {
                            user: {
                                select: { name: true, image: true }
                            }
                        },
                        orderBy: { createdAt: 'asc' }
                    }
                } as any
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
