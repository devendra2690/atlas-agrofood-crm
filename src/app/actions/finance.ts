'use server'

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Decimal } from "@prisma/client/runtime/library";
import { auth } from "@/auth";
import { logActivity } from "./audit";

// --- Types ---
export type CreateInvoiceData = {
    salesOrderId: string;
    totalAmount: number;
    pendingAmount: number;
    dueDate?: Date;
    status?: 'UNPAID' | 'PARTIAL' | 'PAID';
};

// --- Invoice Actions ---

export async function getBills(filters?: {
    page?: number;
    limit?: number;
    status?: string;
}) {
    try {
        const page = filters?.page || 1;
        const limit = filters?.limit || 10;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (filters?.status && filters.status !== 'all') {
            where.status = filters.status;
        }

        const [bills, total] = await prisma.$transaction([
            prisma.bill.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
                include: {
                    vendor: true,
                    createdBy: { select: { name: true } },
                    updatedBy: { select: { name: true } }
                }
            }),
            prisma.bill.count({ where })
        ]);

        const safeBills = bills.map(bill => ({
            ...bill,
            totalAmount: bill.totalAmount.toNumber(),
            pendingAmount: bill.pendingAmount.toNumber()
        }));

        return {
            success: true,
            data: safeBills,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    } catch (e) {
        console.error("Failed to fetch bills", e);
        return { success: false, error: "Failed to fetch bills" };
    }
}

export async function getInvoices(filters?: {
    page?: number;
    limit?: number;
    status?: string;
}) {
    try {
        const page = filters?.page || 1;
        const limit = filters?.limit || 10;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (filters?.status && filters.status !== 'all') {
            where.status = filters.status;
        }

        const [invoices, total] = await prisma.$transaction([
            prisma.invoice.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    createdBy: { select: { name: true } },
                    updatedBy: { select: { name: true } },
                    salesOrder: {
                        include: {
                            client: true,
                            opportunity: true
                        }
                    }
                }
            }),
            prisma.invoice.count({ where })
        ]);

        // Sanitize decimals
        const safeInvoices = invoices.map(inv => ({
            ...inv,
            totalAmount: inv.totalAmount.toNumber(),
            pendingAmount: inv.pendingAmount.toNumber(),
            salesOrder: {
                ...inv.salesOrder,
                totalAmount: inv.salesOrder.totalAmount.toNumber(),
                opportunity: {
                    ...inv.salesOrder.opportunity,
                    targetPrice: inv.salesOrder.opportunity.targetPrice?.toNumber(),
                    quantity: inv.salesOrder.opportunity.quantity?.toNumber()
                }
            }
        }));

        return {
            success: true,
            data: safeInvoices,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    } catch (error) {
        console.error("Failed to fetch invoices:", error);
        return { success: false, error: "Failed to fetch invoices" };
    }
}

export async function createInvoice(data: CreateInvoiceData) {
    try {
        const session = await auth();
        const invoice = await prisma.invoice.create({
            data: {
                createdById: session?.user?.id,
                updatedById: session?.user?.id,
                salesOrderId: data.salesOrderId,
                totalAmount: data.totalAmount,
                pendingAmount: data.pendingAmount,
                dueDate: data.dueDate,
                status: data.status || 'UNPAID'
            }
        });

        const safeInvoice = {
            ...invoice,
            totalAmount: invoice.totalAmount.toNumber(),
            pendingAmount: invoice.pendingAmount.toNumber()
        };

        await logActivity({
            action: "CREATE",
            entityType: "Invoice",
            entityId: invoice.id,
            entityTitle: `Invoice #${invoice.id.slice(0, 8).toUpperCase()}`,
            details: `Created invoice - ₹${safeInvoice.totalAmount.toLocaleString()}`
        });

        revalidatePath('/invoices');
        revalidatePath(`/sales-orders/${data.salesOrderId}`);
        return { success: true, data: safeInvoice };
    } catch (error) {
        console.error("Failed to create invoice:", error);
        return { success: false, error: "Failed to create invoice" };
    }
}

export async function updateInvoiceStatus(id: string, status: 'UNPAID' | 'PARTIAL' | 'PAID') {
    try {
        const session = await auth();
        await prisma.invoice.update({
            where: { id },
            data: {
                status,
                updatedById: session?.user?.id
            }
        });
        revalidatePath('/invoices');
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to update invoice status" };
    }
}

/**
 * Auto-generates an invoice from a Sales Order
 */
export async function generateInvoiceFromSalesOrder(salesOrderId: string) {
    try {
        // 1. Fetch Sales Order
        const so = await prisma.salesOrder.findUnique({
            where: { id: salesOrderId },
            include: { invoices: true }
        });

        if (!so) return { success: false, error: "Sales Order not found" };

        // 2. Check if already invoiced (Prevent duplicates for now, or allow partials later)
        if (so.invoices.length > 0) {
            return { success: false, error: "Invoice already exists for this order" };
        }

        // 3. Create Invoice
        const session = await auth();
        const invoice = await prisma.invoice.create({
            data: {
                createdById: session?.user?.id,
                updatedById: session?.user?.id,
                salesOrderId: so.id,
                totalAmount: so.totalAmount,
                pendingAmount: so.totalAmount, // Initially full amount pending
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default 30 days
                status: 'UNPAID'
            }
        });

        const safeInvoice = {
            ...invoice,
            totalAmount: invoice.totalAmount.toNumber(),
            pendingAmount: invoice.pendingAmount.toNumber()
        };

        revalidatePath('/invoices');
        revalidatePath(`/sales-orders/${salesOrderId}`);
        return { success: true, data: safeInvoice };

    } catch (error) {
        console.error("Failed to generate invoice:", error);
        return { success: false, error: "Failed to generate invoice" };
    }
}

// ... (existing code)

// --- Transaction Actions ---

export async function recordInvoicePayment(data: { invoiceId: string; amount: number; date: Date }) {
    try {
        const invoice = await prisma.invoice.findUnique({
            where: { id: data.invoiceId }
        });

        if (!invoice) return { success: false, error: "Invoice not found" };

        const paymentAmount = new Decimal(data.amount);

        if (paymentAmount.gt(invoice.pendingAmount)) {
            return { success: false, error: "Payment amount cannot exceed pending amount" };
        }

        const newPendingAmount = invoice.pendingAmount.minus(paymentAmount);
        const newStatus = newPendingAmount.lte(0) ? 'PAID' : 'PARTIAL';

        const session = await auth();
        // update invoice and create transaction
        await prisma.$transaction([
            prisma.invoice.update({
                where: { id: data.invoiceId },
                data: {
                    pendingAmount: newPendingAmount,
                    status: newStatus,
                    updatedById: session?.user?.id
                }
            }),
            prisma.transaction.create({
                data: {
                    createdById: session?.user?.id,
                    updatedById: session?.user?.id,
                    type: 'CREDIT',
                    amount: paymentAmount,
                    date: data.date,
                    invoiceId: data.invoiceId
                }
            })
        ]);

        await logActivity({
            action: "PAYMENT",
            entityType: "Invoice",
            entityId: invoice.id,
            entityTitle: `Invoice #${invoice.id.slice(0, 8).toUpperCase()}`,
            details: `Recorded payment of ₹${data.amount.toLocaleString()}. Status: ${newStatus}`
        });

        revalidatePath('/invoices');
        revalidatePath(`/sales-orders/${invoice.salesOrderId}`);
        return { success: true };

    } catch (error) {
        console.error("Failed to record payment:", error);
        return { success: false, error: "Failed to record payment" };
    }
}

export async function recordBillPayment(data: { billId: string; amount: number; date: Date }) {
    try {
        const bill = await prisma.bill.findUnique({
            where: { id: data.billId }
        });

        if (!bill) return { success: false, error: "Bill not found" };

        const paymentAmount = new Decimal(data.amount);

        if (paymentAmount.gt(bill.pendingAmount)) {
            return { success: false, error: "Payment amount cannot exceed pending amount" };
        }

        const newPendingAmount = bill.pendingAmount.minus(paymentAmount);

        let nextStatus = bill.status;
        if (newPendingAmount.lte(0)) {
            nextStatus = 'PAID';
        } else if (bill.status === 'DRAFT') {
            nextStatus = 'APPROVED';
        }

        const session = await auth();
        await prisma.$transaction([
            prisma.bill.update({
                where: { id: data.billId },
                data: {
                    pendingAmount: newPendingAmount,
                    status: nextStatus,
                    updatedById: session?.user?.id
                }
            }),
            prisma.transaction.create({
                data: {
                    createdById: session?.user?.id,
                    updatedById: session?.user?.id,
                    type: 'DEBIT', // Bills are money OUT
                    amount: paymentAmount,
                    date: data.date,
                    billId: data.billId
                }
            })
        ]);

        await logActivity({
            action: "PAYMENT",
            entityType: "Bill",
            entityId: bill.id,
            entityTitle: `Bill #${bill.invoiceNumber || bill.id.slice(0, 8).toUpperCase()}`,
            details: `Recorded payment of ₹${data.amount.toLocaleString()}. Status: ${nextStatus}`
        });

        revalidatePath('/bills');
        revalidatePath(`/purchase-orders/${bill.purchaseOrderId}`);
        return { success: true };

    } catch (error) {
        console.error("Failed to record bill payment:", error);
        return { success: false, error: "Failed to record payment" };
    }
}



export async function createTransaction(data: {
    type: 'CREDIT' | 'DEBIT';
    amount: number;
    date: Date;
    category: string;
    description: string;
    salesOrderId?: string;
}) {
    try {
        const session = await auth();
        await prisma.transaction.create({
            data: {
                createdById: session?.user?.id,
                updatedById: session?.user?.id,
                type: data.type,
                amount: new Decimal(data.amount),
                date: data.date,
                category: data.category,
                description: data.description,
                salesOrderId: data.salesOrderId
            }
        });

        revalidatePath('/finance');
        if (data.salesOrderId) {
            revalidatePath(`/sales-orders/${data.salesOrderId}`);
        }
        return { success: true };
    } catch (error) {
        console.error("Failed to create transaction:", error);
        return { success: false, error: "Failed to create transaction" };
    }
}

export async function getSalesOrderFinancials(salesOrderId: string) {
    try {
        // 1. Revenue: Valid Invoices (PAID/UNPAID) - We count Invoiced Amount as recognized revenue? Or only PAID? 
        // Usually Profitability is based on Invoiced (Accrual basis) or Paid (Cash basis). Let's go with Accrual (Total Invoiced).
        const invoices = await prisma.invoice.findMany({
            where: { salesOrderId },
            select: { totalAmount: true }
        });
        const revenue = invoices.reduce((sum, inv) => sum.plus(inv.totalAmount), new Decimal(0));

        // 2. COGS (Direct Costs): Purchase Orders linked to the Procurement Project of this Sales Order
        // Need to find the Procurement ID via Opportunity
        const salesOrder = await prisma.salesOrder.findUnique({
            where: { id: salesOrderId },
            include: {
                opportunity: {
                    select: {
                        procurementProjectId: true
                    }
                }
            }
        });

        let cogs = new Decimal(0);
        if (salesOrder?.opportunity?.procurementProjectId) {
            const purchaseOrders = await prisma.purchaseOrder.findMany({
                where: {
                    projectId: salesOrder.opportunity.procurementProjectId,
                    status: { not: 'DRAFT' } // Only count confirmed/received POs
                },
                select: { totalAmount: true }
            });
            cogs = purchaseOrders.reduce((sum, po) => sum.plus(po.totalAmount), new Decimal(0));
        }

        // 3. Other Expenses: Transactions directly linked to this Sales Order
        const expenses = await prisma.transaction.findMany({
            where: {
                salesOrderId,
                type: 'DEBIT'
            },
            select: { amount: true }
        });
        const otherExpenses = expenses.reduce((sum, tx) => sum.plus(tx.amount), new Decimal(0));

        // 3.1 Other Income: Manual CREDIT transactions linked to SO
        const income = await prisma.transaction.findMany({
            where: {
                salesOrderId,
                type: 'CREDIT'
            },
            select: { amount: true }
        });
        const otherIncome = income.reduce((sum, tx) => sum.plus(tx.amount), new Decimal(0));

        // 4. Net Profit
        const totalRevenue = revenue.plus(otherIncome);
        const totalCost = cogs.plus(otherExpenses);
        const netProfit = totalRevenue.minus(totalCost);

        return {
            revenue: revenue.toNumber(),
            cogs: cogs.toNumber(),
            otherExpenses: otherExpenses.toNumber(),
            netProfit: netProfit.toNumber()
        };

    } catch (error) {
        console.error("Failed to fetch SO financials:", error);
        return { revenue: 0, cogs: 0, otherExpenses: 0, netProfit: 0 };
    }
}

export async function getFinancialStats() {
    try {
        // Aggregate directly from Transaction table for complete picture
        const stats = await prisma.transaction.groupBy({
            by: ['type'],
            _sum: {
                amount: true
            }
        });

        let totalRevenue = new Decimal(0);
        let totalExpenses = new Decimal(0);

        stats.forEach(stat => {
            if (stat.type === 'CREDIT' && stat._sum.amount) {
                totalRevenue = stat._sum.amount;
            } else if (stat.type === 'DEBIT' && stat._sum.amount) {
                totalExpenses = stat._sum.amount;
            }
        });

        const netProfit = totalRevenue.minus(totalExpenses);

        return {
            revenue: totalRevenue.toNumber(),
            expenses: totalExpenses.toNumber(),
            profit: netProfit.toNumber()
        };
    } catch (error) {
        console.error("Failed to fetch financial stats:", error);
        return { revenue: 0, expenses: 0, profit: 0 };
    }
}

export async function getRecentTransactions() {
    try {
        const transactions = await prisma.transaction.findMany({
            take: 10,
            orderBy: { date: 'desc' },
            include: {
                invoice: { select: { id: true, salesOrder: { select: { client: { select: { name: true } } } } } },
                bill: { select: { invoiceNumber: true, vendor: { select: { name: true } } } }
            }
        });

        return transactions.map(tx => {
            let description = tx.description || "";
            let reference = tx.category || "Manual";

            // If linked to Invoice/Bill, override description/reference logic
            if (tx.invoice) {
                description = `Payment from ${tx.invoice.salesOrder.client.name}`;
                reference = tx.invoice.id.slice(0, 8) || 'Invoice';
            } else if (tx.bill) {
                description = `Payment to ${tx.bill.vendor.name}`;
                reference = tx.bill.invoiceNumber || 'Bill';
            }

            return {
                id: tx.id,
                type: tx.type,
                amount: tx.amount.toNumber(),
                date: tx.date,
                description: description || (tx.type === 'CREDIT' ? 'Income' : 'Expense'),
                reference: reference
            };
        });
    } catch (error) {
        console.error("Failed to fetch transactions:", error);
        return [];
    }
}


export async function getSalesOrderTransactions(salesOrderId: string) {
    try {
        const transactions = await prisma.transaction.findMany({
            where: { salesOrderId },
            orderBy: { date: 'desc' },
            select: {
                id: true,
                type: true,
                amount: true,
                date: true,
                category: true,
                description: true
            }
        });

        return transactions.map(tx => ({
            ...tx,
            amount: tx.amount.toNumber()
        }));
    } catch (error) {
        return [];
    }
}


export async function getSalesOrdersForSelection() {
    try {
        const orders = await prisma.salesOrder.findMany({
            select: {
                id: true,
                client: { select: { name: true } },
                opportunity: { select: { productName: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        return orders;
    } catch (error) {
        return [];
    }
}

export async function getOtherIncomeTransactions() {
    try {
        const transactions = await prisma.transaction.findMany({
            where: {
                type: 'CREDIT',
                invoiceId: null // Only manually added income (can be linked to SO)
            },
            orderBy: { date: 'desc' },
            include: {
                salesOrder: { select: { client: { select: { name: true } } } }
            }
        });

        return transactions.map(tx => ({
            id: tx.id,
            amount: tx.amount.toNumber(),
            date: tx.date,
            category: tx.category || "Uncategorized",
            description: tx.description || "Manual Income",
            linkedTo: tx.salesOrder ? `Order: ${tx.salesOrder.client.name}` : null
        }));
    } catch (error) {
        console.error("Failed to fetch other income:", error);
        return [];
    }
}

export async function getOtherExpenseTransactions() {
    try {
        const transactions = await prisma.transaction.findMany({
            where: {
                type: 'DEBIT',
                billId: null, // As bill payment creates transaction with billId
                // We NOW allow salesOrderId to be present
            },
            orderBy: { date: 'desc' },
            include: {
                salesOrder: { select: { client: { select: { name: true } } } }
            }
        });

        return transactions.map(tx => ({
            id: tx.id,
            amount: tx.amount.toNumber(),
            date: tx.date,
            category: tx.category || "Uncategorized",
            description: tx.description || "Manual Expense",
            linkedTo: tx.salesOrder ? `Order: ${tx.salesOrder.client.name}` : null
        }));
    } catch (error) {
        console.error("Failed to fetch other expenses:", error);
        return [];
    }
}

