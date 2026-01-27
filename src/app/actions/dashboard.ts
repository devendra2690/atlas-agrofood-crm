'use server'

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function getDashboardStats() {
    try {
        const session = await auth();
        if (!session?.user) {
            return { success: false, error: "Unauthorized" };
        }

        // Parallel fetch for performance
        const [
            salesStats,
            procurementStats,
            logisticsStats,
            financeStats
        ] = await Promise.all([
            getSalesStats(),
            getProcurementStats(),
            getLogisticsStats(),
            getFinanceStats()
        ]);

        return {
            success: true,
            data: {
                sales: salesStats,
                procurement: procurementStats,
                logistics: logisticsStats,
                finance: financeStats
            }
        };

    } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
        return { success: false, error: "Failed to load dashboard data" };
    }
}

async function getSalesStats() {
    // 1. Total Revenue (Closed Won Opportunities)
    const wonOpportunities = await prisma.salesOpportunity.findMany({
        where: { status: 'CLOSED_WON' },
        select: { procurementQuantity: true, targetPrice: true, quantity: true } // Assuming targetPrice is the sale price per unit? Or should we use SalesOrder?
        // Actually, Sales Orders are the source of truth for "Sales Revenue".
    });

    // Let's use Sales Orders for Revenue
    const salesOrders = await prisma.salesOrder.findMany({
        where: { status: { not: 'CANCELLED' } },
        select: { totalAmount: true, status: true }
    });

    const totalRevenue = salesOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0);

    // 2. Active Leads (Companies of type PROSPECT that are active)
    const activeLeads = await prisma.company.count({
        where: { type: 'PROSPECT', status: 'ACTIVE' }
    });

    // 3. Won Opportunities Count
    const wonDealsCount = await prisma.salesOpportunity.count({
        where: { status: 'CLOSED_WON' }
    });

    // 4. Open Opportunities Count
    const openDealsCount = await prisma.salesOpportunity.count({
        where: { status: 'OPEN' }
    });

    return {
        totalRevenue,
        activeLeads,
        wonDealsCount,
        openDealsCount
    };
}

async function getProcurementStats() {
    // 1. Active Projects
    const activeProjects = await prisma.procurementProject.count({
        where: { status: 'SOURCING' }
    });

    // 2. Pending Purchase Orders
    const pendingPOs = await prisma.purchaseOrder.count({
        where: { status: 'PENDING' }
    });

    // 3. Total Spend (Completed POs)
    const completedPOs = await prisma.purchaseOrder.findMany({
        where: { status: { in: ['RECEIVED', 'IN_TRANSIT'] } }, // Assuming these mean we are committed/paid? Or check Bills?
        // Let's stick to PO amount for now as "Committed Spend"
        select: { totalAmount: true }
    });
    const committedSpend = completedPOs.reduce((sum, po) => sum + Number(po.totalAmount), 0);

    return {
        activeProjects,
        pendingPOs,
        committedSpend
    };
}

async function getLogisticsStats() {
    // 1. Active Shipments
    const activeShipments = await prisma.shipment.count({
        where: { status: 'IN_TRANSIT' }
    });

    // 2. Pending Deliveries (Shipments that are active) => Same as active shipments roughly.
    // Let's count recently delivered instead.
    const recentlyDelivered = await prisma.shipment.count({
        where: {
            status: 'DELIVERED',
            actualDeliveryDate: {
                gte: new Date(new Date().setDate(new Date().getDate() - 30)) // Last 30 days
            }
        }
    });

    return {
        activeShipments,
        recentlyDelivered
    };
}

async function getFinanceStats() {
    // 1. Pending Invoices (Receivables)
    const pendingInvoices = await prisma.invoice.findMany({
        where: { status: { not: 'PAID' } },
        select: { pendingAmount: true }
    });
    const totalReceivables = pendingInvoices.reduce((sum, inv) => sum + Number(inv.pendingAmount), 0);

    // 2. Pending Bills (Payables)
    const pendingBills = await prisma.bill.findMany({
        where: { status: { not: 'PAID' } },
        select: { pendingAmount: true }
    });
    const totalPayables = pendingBills.reduce((sum, bill) => sum + Number(bill.pendingAmount), 0);

    return {
        totalReceivables,
        totalPayables
    };
}

export async function getSalesChartData() {
    // Group sales by month for the current year
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31);

    const salesOrders = await prisma.salesOrder.findMany({
        where: {
            status: { not: 'CANCELLED' },
            createdAt: {
                gte: startOfYear,
                lte: endOfYear
            }
        },
        select: {
            createdAt: true,
            totalAmount: true
        }
    });

    // Initialize months
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
        name: new Date(0, i).toLocaleString('default', { month: 'short' }),
        total: 0
    }));

    salesOrders.forEach(order => {
        const month = new Date(order.createdAt).getMonth();
        monthlyData[month].total += Number(order.totalAmount);
    });

    return monthlyData;
}

export async function getRecentActivity() {
    const interactions = await prisma.interactionLog.findMany({
        take: 5,
        orderBy: { date: 'desc' },
        include: {
            company: { select: { name: true } },
            user: { select: { name: true, image: true } }
        }
    });

    return interactions.map(interaction => ({
        id: interaction.id,
        user: interaction.user,
        action: `logged an interaction`,
        target: interaction.company.name,
        timestamp: interaction.date,
        details: interaction.description
    }));
}

export async function getPendingTasks() {
    const session = await auth();
    if (!session?.user?.id) return [];

    const tasks = await prisma.todo.findMany({
        where: {
            // userId: session.user.id, // Ideally filter by user, but schema might not link Todo to User properly? checked earlier it does.
            // Wait, schema check: Todo has userId? Yes (Todo_userId_fkey).
            userId: session.user.id,
            status: { not: 'COMPLETED' }
        },
        take: 5,
        orderBy: { dueDate: 'asc' }, // Urgent first
        select: {
            id: true,
            content: true,
            dueDate: true,
            priority: true
        }
    });

    return tasks;
}
