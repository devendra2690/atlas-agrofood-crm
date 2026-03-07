"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function createDocument(data: {
    title: string;
    type: string;
    fileUrl: string;
    expiryDate?: Date | null;
    details?: string;
    companyId?: string;
}) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    try {
        const document = await prisma.document.create({
            data: {
                ...data,
                createdById: session.user.id,
            },
        });
        revalidatePath("/documents");
        return { success: true, document };
    } catch (error) {
        console.error("Failed to create document:", error);
        return { success: false, error: "Failed to create document." };
    }
}

export async function getDocuments() {
    try {
        const documents = await prisma.document.findMany({
            include: {
                company: { select: { name: true } },
                createdBy: { select: { name: true } },
            },
            orderBy: { createdAt: "desc" },
        });
        return { success: true, documents };
    } catch (error) {
        console.error("Failed to fetch documents:", error);
        return { success: false, documents: [] };
    }
}

export async function deleteDocument(id: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    try {
        await prisma.document.delete({
            where: { id },
        });
        revalidatePath("/documents");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete document:", error);
        return { success: false, error: "Failed to delete document." };
    }
}
