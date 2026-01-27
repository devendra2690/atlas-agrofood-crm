"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export type SearchResult = {
    id: string;
    type: "Company" | "Opportunity" | "SalesOrder" | "PurchaseOrder";
    title: string;
    subtitle: string;
    url: string;
};

export async function searchGlobal(query: string): Promise<SearchResult[]> {
    if (!query || query.length < 2) return [];

    const session = await auth();
    if (!session?.user) return [];

    const results: SearchResult[] = [];

    // 1. Companies (Name or Email)
    const companies = await prisma.company.findMany({
        where: {
            OR: [
                { name: { contains: query, mode: "insensitive" } },
                { email: { contains: query, mode: "insensitive" } }
            ]
        },
        take: 3,
        select: { id: true, name: true, type: true }
    });

    companies.forEach(c => results.push({
        id: c.id,
        type: "Company",
        title: c.name,
        subtitle: c.type,
        url: `/companies/${c.id}`
    }));

    // 2. Opportunities (Product or Company Name)
    const opportunities = await prisma.salesOpportunity.findMany({
        where: {
            OR: [
                { productName: { contains: query, mode: "insensitive" } },
                { company: { name: { contains: query, mode: "insensitive" } } }
            ]
        },
        take: 3,
        include: { company: { select: { name: true } } }
    });

    opportunities.forEach(o => results.push({
        id: o.id,
        type: "Opportunity",
        title: o.productName,
        subtitle: `Opp with ${o.company.name}`,
        url: `/opportunities?highlight=${o.id}` // Use deep link if on same page, or redirect
        // Ideally should support direct page or filters. For now, opportunities list is best.
    }));

    // 3. Sales Orders (ID or Client)
    const salesOrders = await prisma.salesOrder.findMany({
        where: {
            OR: [
                { id: { contains: query, mode: "insensitive" } },
                { client: { name: { contains: query, mode: "insensitive" } } }
            ]
        },
        take: 3,
        include: { client: { select: { name: true } } }
    });

    salesOrders.forEach(so => results.push({
        id: so.id,
        type: "SalesOrder",
        title: `SO #${so.id.slice(0, 8).toUpperCase()}`,
        subtitle: `Client: ${so.client.name}`,
        url: `/sales-orders/${so.id}`
    }));

    // 4. Purchase Orders (ID or Vendor)
    const purchaseOrders = await prisma.purchaseOrder.findMany({
        where: {
            OR: [
                { id: { contains: query, mode: "insensitive" } },
                { vendor: { name: { contains: query, mode: "insensitive" } } }
            ]
        },
        take: 3,
        include: { vendor: { select: { name: true } } }
    });

    purchaseOrders.forEach(po => results.push({
        id: po.id,
        type: "PurchaseOrder",
        title: `PO #${po.id.slice(0, 8).toUpperCase()}`,
        subtitle: `Vendor: ${po.vendor.name}`,
        url: `/purchase-orders/${po.id}`
    }));

    return results;
}
