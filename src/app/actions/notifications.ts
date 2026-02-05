"use server";

import { prisma } from "@/lib/prisma";
import { formatDistanceToNow, isAfter, isBefore, addDays } from "date-fns";

export type NotificationItem = {
    id: string;
    title: string;
    message: string;
    time: string; // e.g., "Due in 2 days" or "Overdue by 1 day"
    type: "OVERDUE" | "DUE_SOON";
    link: string;
    entityType: "Invoice" | "Bill" | "Opportunity" | "Activity";
    date: Date;
};

export async function getDeadlineAlerts(): Promise<{ success: boolean; data: NotificationItem[] }> {
    try {
        const today = new Date();
        const startOfToday = new Date(today.setHours(0, 0, 0, 0)); // Start of "Today"
        const nextWeek = addDays(today, 7);

        const alerts: NotificationItem[] = [];

        // 1. Invoices (Receivable) - UNPAID & Due Date <= nextWeek
        const invoices = await prisma.invoice.findMany({
            where: {
                status: "UNPAID",
                dueDate: { not: null, lte: nextWeek }
            },
            include: { salesOrder: { select: { id: true, clientId: true, client: { select: { name: true } } } } }
        });

        for (const inv of invoices) {
            if (!inv.dueDate) continue;
            const isOverdue = isBefore(inv.dueDate, today);

            alerts.push({
                id: inv.id,
                title: isOverdue ? "Invoice Overdue" : "Invoice Due Soon",
                message: `${inv.salesOrder.client.name} - ₹${Number(inv.pendingAmount).toLocaleString()}`,
                time: formatDistanceToNow(inv.dueDate, { addSuffix: true }),
                type: isOverdue ? "OVERDUE" : "DUE_SOON",
                link: `/sales-orders/${inv.salesOrder.id}`,
                entityType: "Invoice",
                date: inv.dueDate
            });
        }

        // 2. Bills (Payable) - Not PAID & Due Date <= nextWeek
        const bills = await prisma.bill.findMany({
            where: {
                status: { not: "PAID" },
                dueDate: { not: null, lte: nextWeek }
            },
            include: { vendor: { select: { name: true } } }
        });

        for (const bill of bills) {
            if (!bill.dueDate) continue; // Should be handled by query but safe check
            const isOverdue = isBefore(bill.dueDate, today);

            alerts.push({
                id: bill.id,
                title: isOverdue ? "Bill Payment Overdue" : "Bill Payment Due",
                message: `${bill.vendor.name} - ₹${Number(bill.pendingAmount).toLocaleString()}`,
                time: formatDistanceToNow(bill.dueDate, { addSuffix: true }),
                type: isOverdue ? "OVERDUE" : "DUE_SOON",
                link: bill.purchaseOrderId ? `/purchase-orders/${bill.purchaseOrderId}` : `/bills`,
                entityType: "Bill",
                date: bill.dueDate
            });
        }

        // 3. Sales Opportunities - OPEN & Deadline <= nextWeek
        const opportunities = await prisma.salesOpportunity.findMany({
            where: {
                status: "OPEN",
                deadline: { not: null, lte: nextWeek }
            },
            include: { company: { select: { name: true } } }
        });

        for (const opp of opportunities) {
            if (!opp.deadline) continue;
            const isOverdue = isBefore(opp.deadline, today);

            alerts.push({
                id: opp.id,
                title: isOverdue ? "Opportunity Expired" : "Opportunity Deadline",
                message: `${opp.company.name} - ${opp.productName}`,
                time: formatDistanceToNow(opp.deadline, { addSuffix: true }),
                type: isOverdue ? "OVERDUE" : "DUE_SOON",
                link: `/opportunities?highlight=${opp.id}`,
                entityType: "Opportunity",
                date: opp.deadline
            });
        }


        // 4. Activity/Todos - PENDING & Due Date <= nextWeek
        const todos = await prisma.todo.findMany({
            where: {
                status: { not: "COMPLETED" },
                dueDate: { not: null, lte: nextWeek }
            }
        });

        for (const todo of todos) {
            if (!todo.dueDate) continue;

            // Overdue if strictly before TODAY (Start of today)
            const isOverdue = isBefore(todo.dueDate, startOfToday);

            alerts.push({
                id: todo.id,
                title: isOverdue ? "Activity Overdue" : "Activity Due Soon",
                message: todo.content,
                time: formatDistanceToNow(todo.dueDate, { addSuffix: true }),
                type: isOverdue ? "OVERDUE" : "DUE_SOON",
                link: `/notes?highlight=${todo.id}`,
                entityType: "Activity",
                date: todo.dueDate
            });
        }

        // Sort by urgency (Date asc)
        alerts.sort((a, b) => a.date.getTime() - b.date.getTime());

        return { success: true, data: alerts };
    } catch (error) {
        console.error("Failed to fetch deadline alerts:", error);
        return { success: false, data: [] };
    }
}
