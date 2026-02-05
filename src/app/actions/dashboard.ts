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
    // Use aggregate for revenue calculation
    const revenueAgg = await prisma.salesOrder.aggregate({
        where: { status: { not: 'CANCELLED' } },
        _sum: { totalAmount: true }
    });
    const totalRevenue = Number(revenueAgg._sum.totalAmount || 0);

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
    const spendAgg = await prisma.purchaseOrder.aggregate({
        where: { status: { in: ['RECEIVED', 'IN_TRANSIT'] } },
        _sum: { totalAmount: true }
    });
    const committedSpend = Number(spendAgg._sum.totalAmount || 0);

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
    const receivablesAgg = await prisma.invoice.aggregate({
        where: { status: { not: 'PAID' } },
        _sum: { pendingAmount: true }
    });
    const totalReceivables = Number(receivablesAgg._sum.pendingAmount || 0);

    // 2. Pending Bills (Payables)
    const payablesAgg = await prisma.bill.aggregate({
        where: { status: { not: 'PAID' } },
        _sum: { pendingAmount: true }
    });
    const totalPayables = Number(payablesAgg._sum.pendingAmount || 0);

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

    // Use groupBy to aggregate in DB instead of JS loop
    const salesAggregates = await prisma.salesOrder.groupBy({
        by: ['createdAt'],
        where: {
            status: { not: 'CANCELLED' },
            createdAt: {
                gte: startOfYear,
                lte: endOfYear
            }
        },
        _sum: {
            totalAmount: true
        }
    });

    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
        name: new Date(0, i).toLocaleString('default', { month: 'short' }),
        total: 0
    }));

    salesAggregates.forEach(agg => {
        const month = new Date(agg.createdAt).getMonth();
        monthlyData[month].total += Number(agg._sum.totalAmount || 0);
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
            OR: [
                { userId: session.user.id },
                { assignedToId: session.user.id }
            ],
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
