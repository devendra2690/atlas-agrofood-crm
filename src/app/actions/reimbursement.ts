'use server'

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export type CreateReimbursementData = {
    amount: number;
    description: string;
    category?: string;
    receiptUrl?: string;
};

export async function createReimbursement(data: CreateReimbursementData) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Unauthorized" };
        }

        const reimbursement = await prisma.reimbursement.create({
            data: {
                userId: session.user.id,
                amount: data.amount,
                description: data.description,
                category: data.category || "General",
                receiptUrl: data.receiptUrl,
            }
        });

        revalidatePath('/expenses/reimbursements');
        revalidatePath('/reimbursements');
        return { 
            success: true, 
            data: { ...reimbursement, amount: reimbursement.amount.toNumber() } 
        };
    } catch (error) {
        console.error("Failed to create reimbursement:", error);
        return { success: false, error: "Failed to create reimbursement" };
    }
}

export async function updateReimbursement(id: string, data: CreateReimbursementData) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Unauthorized" };
        }

        const existing = await prisma.reimbursement.findUnique({ where: { id } });
        
        if (!existing || existing.userId !== session.user.id) {
            return { success: false, error: "Unauthorized or not found" };
        }

        if (existing.status !== 'REJECTED') {
            return { success: false, error: "Only rejected claims can be edited and resubmitted." };
        }

        const reimbursement = await prisma.reimbursement.update({
            where: { id },
            data: {
                amount: data.amount,
                description: data.description,
                category: data.category || "General",
                receiptUrl: data.receiptUrl,
                status: 'PENDING', // Reset status to PENDING
            }
        });

        revalidatePath('/expenses/reimbursements');
        revalidatePath('/reimbursements');
        return { 
            success: true, 
            data: { ...reimbursement, amount: reimbursement.amount.toNumber() } 
        };
    } catch (error) {
        console.error("Failed to update reimbursement:", error);
        return { success: false, error: "Failed to update reimbursement" };
    }
}

export async function getReimbursements(filters?: { status?: string }) {
    try {
        const session = await auth();
        if (!session?.user?.id) return [];

        const where: any = {};
        
        // If not admin, only show their own reimbursements
        if (session.user.role !== 'ADMIN') {
            where.userId = session.user.id;
        }
        
        if (filters?.status) {
            where.status = filters.status;
        }

        const reimbursements = await prisma.reimbursement.findMany({
            where,
            orderBy: { date: 'desc' },
            include: {
                user: { select: { name: true, image: true, email: true } },
                processedBy: { select: { name: true } },
                transactions: true
            }
        });

        return reimbursements.map((r: any) => ({
            ...r,
            amount: r.amount.toNumber(),
            transactions: r.transactions?.map((tx: any) => ({
                ...tx,
                amount: tx.amount.toNumber()
            })) || []
        }));
    } catch (error) {
        console.error("Failed to fetch reimbursements:", error);
        return [];
    }
}

export async function updateReimbursementStatus(id: string, status: 'APPROVED' | 'REJECTED' | 'PENDING', adminNotes?: string) {
    try {
        const session = await auth();
        if (!session?.user?.id || session.user.role !== 'ADMIN') {
            return { success: false, error: "Unauthorized. Admin access required." };
        }

        const existing = await prisma.reimbursement.findUnique({ where: { id } });
        if (!existing) return { success: false, error: "Not found" };

        let reimbursement;

        if (status === 'APPROVED' && existing.status !== 'APPROVED') {
            // Generate LIABILITY when first approved
            reimbursement = await prisma.reimbursement.update({
                where: { id },
                data: {
                    status,
                    adminNotes,
                    processedById: session.user.id,
                    transactions: {
                        create: {
                            type: 'LIABILITY',
                            amount: existing.amount,
                            description: `[Owed to Employee] Reimbursement: ${existing.description}`,
                            category: 'Other Expense', // Fits into the Other Expenses dashboard
                            createdById: session.user.id,
                            updatedById: session.user.id
                        }
                    }
                }
            });
        } else {
            // Just update the status normally (e.g. REJECTED)
            reimbursement = await prisma.reimbursement.update({
                where: { id },
                data: {
                    status,
                    adminNotes,
                    processedById: session.user.id
                }
            });
        }

        revalidatePath('/expenses/reimbursements');
        revalidatePath('/reimbursements');
        return { 
            success: true, 
            data: { ...reimbursement, amount: reimbursement.amount.toNumber() } 
        };
    } catch (error) {
        console.error("Failed to update reimbursement status:", error);
        return { success: false, error: "Failed to update status" };
    }
}

export async function payReimbursement(id: string, adminNotes?: string) {
    try {
        const session = await auth();
        if (!session?.user?.id || session.user.role !== 'ADMIN') {
            return { success: false, error: "Unauthorized. Admin access required." };
        }

        const reimbursement = await prisma.reimbursement.findUnique({
            where: { id },
            include: { user: true }
        });

        if (!reimbursement) {
            return { success: false, error: "Reimbursement not found" };
        }

        if (reimbursement.status === 'PAID') {
            return { success: false, error: "Reimbursement is already paid" };
        }

        // Use a transaction to ensure both records are updated together
        // We will "Settle" the Liability by converting it to a DEBIT (Real cash leaving)
        // Or if no liability exists (legacy), we just create one.
        const existingLiability = await prisma.transaction.findFirst({
            where: { reimbursementId: id, type: 'LIABILITY' }
        });

        const transactionUpdates = [];
        
        if (existingLiability) {
            transactionUpdates.push(
                prisma.transaction.update({
                    where: { id: existingLiability.id },
                    data: {
                        type: 'DEBIT',
                        description: `Reimbursement Paid to ${reimbursement.user.name || reimbursement.user.email}: ${reimbursement.description}`
                    }
                })
            );
        } else {
            transactionUpdates.push(
                prisma.transaction.create({
                    data: {
                        type: 'DEBIT',
                        amount: reimbursement.amount,
                        description: `Reimbursement to ${reimbursement.user.name || reimbursement.user.email}: ${reimbursement.description}`,
                        category: 'Other Expense',
                        receipts: reimbursement.receiptUrl ? [reimbursement.receiptUrl] : [],
                        reimbursementId: id,
                        createdById: session.user.id,
                        updatedById: session.user.id
                    }
                })
            );
        }

        const [updatedReimbursement] = await prisma.$transaction([
            prisma.reimbursement.update({
                where: { id },
                data: {
                    status: 'PAID',
                    adminNotes: adminNotes || reimbursement.adminNotes,
                    processedById: session.user.id
                }
            }),
            ...transactionUpdates
        ]);

        revalidatePath('/expenses/reimbursements');
        revalidatePath('/reimbursements');
        revalidatePath('/bills'); // Finance dashboard
        
        return { 
            success: true, 
            data: { ...updatedReimbursement, amount: updatedReimbursement.amount.toNumber() } 
        };
    } catch (error) {
        console.error("Failed to pay reimbursement:", error);
        return { success: false, error: "Failed to process payment" };
    }
}
