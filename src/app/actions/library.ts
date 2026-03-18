"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function getLibraryDocs() {
    try {
        const docs = await prisma.libraryDoc.findMany({
            include: { createdBy: { select: { name: true } } },
            orderBy: { createdAt: "desc" },
        });
        return { success: true, data: docs };
    } catch (error) {
        console.error("Failed to fetch library docs:", error);
        return { success: false, data: [] };
    }
}

export async function createLibraryDoc(data: {
    title: string;
    description: string;
    fileUrl: string;
    fileType: string;
    category?: string;
}) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    try {
        const doc = await prisma.libraryDoc.create({
            data: { ...data, createdById: session.user.id },
        });
        revalidatePath("/library");
        return { success: true, data: doc };
    } catch (error) {
        console.error("Failed to create library doc:", error);
        return { success: false, error: "Failed to create document." };
    }
}

export async function updateLibraryDoc(
    id: string,
    data: { title: string; description: string; category?: string }
) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    try {
        const doc = await prisma.libraryDoc.update({ where: { id }, data });
        revalidatePath("/library");
        return { success: true, data: doc };
    } catch (error) {
        console.error("Failed to update library doc:", error);
        return { success: false, error: "Failed to update document." };
    }
}

export async function deleteLibraryDoc(id: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    try {
        await prisma.libraryDoc.delete({ where: { id } });
        revalidatePath("/library");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete library doc:", error);
        return { success: false, error: "Failed to delete document." };
    }
}
