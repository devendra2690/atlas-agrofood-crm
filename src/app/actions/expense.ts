'use server'

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function createExpense(data: {
    description: string;
    totalAmount: number;
    category?: string;
    paidById: string;
    date: Date;
    splits: { userId: string; owedAmount: number }[];
}) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const expense = await prisma.expense.create({
            data: {
                description: data.description,
                totalAmount: data.totalAmount,
                category: data.category,
                paidById: data.paidById,
                date: data.date,
                createdById: session.user.id,
                updatedById: session.user.id,
                splits: {
                    create: data.splits.map(split => ({
                        userId: split.userId,
                        owedAmount: split.owedAmount
                    }))
                }
            },
            include: { splits: true }
        });

        revalidatePath("/expenses");
        return { success: true, data: expense };
    } catch (error: any) {
        console.error("Failed to create expense:", error);
        return { success: false, error: error.message || "Failed to create expense" };
    }
}

export async function createSettlement(data: {
    payerId: string;
    payeeId: string;
    amount: number;
    date: Date;
    method?: string;
    notes?: string;
}) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const settlement = await prisma.expenseSettlement.create({
            data: {
                amount: data.amount,
                payerId: data.payerId,
                payeeId: data.payeeId,
                date: data.date,
                method: data.method,
                notes: data.notes
            }
        });

        revalidatePath("/expenses");
        return { success: true, data: settlement };
    } catch (error: any) {
        console.error("Failed to record settlement:", error);
        return { success: false, error: error.message || "Failed to record settlement" };
    }
}

export async function getExpensesFeed() {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, data: [] };

        // Fetch expenses AND settlements, and merge them for a timeline feed
        const expenses = await prisma.expense.findMany({
            include: {
                paidBy: { select: { name: true, image: true, id: true } },
                splits: {
                    include: { user: { select: { name: true, image: true, id: true } } }
                }
            },
            orderBy: { date: 'desc' },
            take: 50
        });

        const settlements = await prisma.expenseSettlement.findMany({
            include: {
                payer: { select: { name: true, image: true, id: true } },
                payee: { select: { name: true, image: true, id: true } }
            },
            orderBy: { date: 'desc' },
            take: 50
        });

        const feed = [
            ...expenses.map(e => ({ type: 'EXPENSE', date: e.date, data: e })),
            ...settlements.map(s => ({ type: 'SETTLEMENT', date: s.date, data: s }))
        ];

        feed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return { success: true, data: feed };
    } catch (error) {
        console.error("Failed to get feed:", error);
        return { success: false, data: [] };
    }
}

export async function getBalances() {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, data: null };
        const myUserId = session.user.id;

        // In a real sophisticated system, we might query just the balances for the logged-in user.
        // For simplicity and to show everyone's balances, we can aggregate raw data.

        // 1. Get all expenses I paid for
        const paidExpenses = await prisma.expense.findMany({
            where: { paidById: myUserId },
            include: { splits: true }
        });

        // 2. Get all splits I owe
        const mySplits = await prisma.expenseSplit.findMany({
            where: { userId: myUserId },
            include: { expense: true }
        });

        // 3. Get settlements I paid
        const settlementsPaid = await prisma.expenseSettlement.findMany({
            where: { payerId: myUserId }
        });

        // 4. Get settlements I received
        const settlementsReceived = await prisma.expenseSettlement.findMany({
            where: { payeeId: myUserId }
        });

        let totalOwedToMe = 0; // Money others owe me
        let totalIOwe = 0; // Money I owe others

        // Map of UserId -> Net Balance (Positive means they owe me, Negative means I owe them)
        const pairwiseBalances: Record<string, number> = {};

        // Calculate what others owe me
        for (const exp of paidExpenses) {
            for (const split of exp.splits) {
                if (split.userId !== myUserId) {
                    const amt = Number(split.owedAmount);
                    totalOwedToMe += amt;
                    pairwiseBalances[split.userId] = (pairwiseBalances[split.userId] || 0) + amt;
                }
            }
        }

        // Calculate what I owe others
        for (const split of mySplits) {
            if (split.expense.paidById !== myUserId) {
                const amt = Number(split.owedAmount);
                totalIOwe += amt;
                // If I owe them, they subtract from the pairwise balance
                pairwiseBalances[split.expense.paidById] = (pairwiseBalances[split.expense.paidById] || 0) - amt;
            }
        }

        // Apply settlements I paid (reduces what I owe them)
        for (const st of settlementsPaid) {
            const amt = Number(st.amount);
            totalIOwe -= amt;
            // Pushing money to them means my balance with them goes UP (towards 0 or positive)
            pairwiseBalances[st.payeeId] = (pairwiseBalances[st.payeeId] || 0) + amt;
        }

        // Apply settlements I received (reduces what they owe me)
        for (const st of settlementsReceived) {
            const amt = Number(st.amount);
            totalOwedToMe -= amt;
            // Receiving money from them means my balance with them goes DOWN
            pairwiseBalances[st.payerId] = (pairwiseBalances[st.payerId] || 0) - amt;
        }

        // Net Balance = (What people owe me) - (What I owe people)
        const netBalance = totalOwedToMe - totalIOwe;

        // Fetch User details for the pairwise map
        const userIds = Object.keys(pairwiseBalances);
        const users = await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, name: true, image: true, email: true }
        });

        const detailedPairwise = userIds.map(uid => ({
            userId: uid,
            user: users.find(u => u.id === uid),
            netBalance: pairwiseBalances[uid]
        })).filter(pb => pb.netBalance !== 0); // Hide settled up pairs

        return {
            success: true,
            data: {
                totalOwedToMe,
                totalIOwe,
                netBalance,
                pairwiseBalances: detailedPairwise
            }
        };

    } catch (error) {
        console.error("Failed to get balances:", error);
        return { success: false, data: null };
    }
}
