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
