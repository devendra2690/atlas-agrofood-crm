"use server";

import { prisma } from "@/lib/prisma";
import { SourcingRequestStatus, Sourcingpriority } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { logActivity } from "./audit";

export type VendorVarietyFormData = {
    vendorId: string;
    varietyId: string;
    originStateId?: string;
    leadTime?: string;
    supplyCapacity?: string;
    qualityGrade?: string;
    isBlacklisted?: boolean;
};

// --- Sales Actions ---

export async function searchCommodities(query: string) {
    try {
        if (!query) return { success: true, data: [] };

        const commodities = await prisma.commodity.findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: "insensitive" } },
                    { varieties: { some: { name: { contains: query, mode: "insensitive" } } } }
                ]
            },
            include: {
                varieties: {
                    include: {
                        _count: {
                            select: { vendorMappings: true }
                        }
                    }
                }
            },
            take: 10
        });

        // Flatten checks for specific varieties if query matches variety name
        const results = commodities.map(c => ({
            ...c,
            varieties: c.varieties.filter(v =>
                v.name.toLowerCase().includes(query.toLowerCase()) ||
                c.name.toLowerCase().includes(query.toLowerCase())
            )
        }));

        return { success: true, data: results };
    } catch (error) {
        console.error("Search failed:", error);
        return { success: false, error: "Search failed" };
    }
}

export async function createSourcingRequest(data: { item: string; volume?: string; priority?: Sourcingpriority }) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const request = await prisma.sourcingRequest.create({
            data: {
                requestedItem: data.item,
                volume: data.volume,
                priority: data.priority || "NORMAL",
                salesUserId: session.user.id,
                status: "OPEN"
            }
        });

        await logActivity({
            action: "CREATE",
            entityType: "SourcingRequest",
            entityId: request.id,
            details: `Created sourcing request for ${data.item}`
        });

        revalidatePath("/matrix");
        return { success: true };
    } catch (error) {
        console.error("Failed to create sourcing request:", error);
        return { success: false, error: "Failed to create request" };
    }
}

// --- Procurement Actions ---

export async function getVendorMatrix(filters?: { commodityId?: string }) {
    try {
        const vendorVarieties = await prisma.vendorVariety.findMany({
            where: filters?.commodityId ? {
                variety: { commodityId: filters.commodityId }
            } : {},
            include: {
                vendor: true,
                variety: { include: { commodity: true } },
                originState: true
            },
            orderBy: { vendor: { name: 'asc' } }
        });

        return { success: true, data: vendorVarieties };
    } catch (error) {
        console.error("Failed to fetch matrix:", error);
        return { success: false, error: "Failed to fetch matrix" };
    }
}

export async function getSourcingRequests() {
    try {
        const requests = await prisma.sourcingRequest.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                salesUser: { select: { name: true, email: true } }
            }
        });
        return { success: true, data: requests };
    } catch (error) {
        console.error("Failed to fetch requests:", error);
        return { success: false, error: "Failed to fetch requests" };
    }
}

export async function updateSourcingRequestStatus(id: string, status: SourcingRequestStatus) {
    try {
        await prisma.sourcingRequest.update({
            where: { id },
            data: { status }
        });

        await logActivity({
            action: "STATUS_CHANGE",
            entityType: "SourcingRequest",
            entityId: id,
            details: `Updated sourcing request status to ${status}`
        });

        revalidatePath("/matrix");
        return { success: true };
    } catch (error) {
        console.error("Failed to update status:", error);
        return { success: false, error: "Failed to update status" };
    }
}

export async function manageVendorVariety(
    action: "CREATE" | "UPDATE" | "DELETE",
    data: VendorVarietyFormData & { id?: string }
) {
    try {
        if (action === "CREATE") {
            const result = await prisma.vendorVariety.create({
                data: {
                    vendorId: data.vendorId,
                    varietyId: data.varietyId,
                    originStateId: data.originStateId,
                    leadTime: data.leadTime,
                    supplyCapacity: data.supplyCapacity,
                    qualityGrade: data.qualityGrade,
                    isBlacklisted: data.isBlacklisted || false
                }
            });
            await logActivity({
                action: "CREATE",
                entityType: "VendorMatrix",
                entityId: result.id,
                details: "Added variety to vendor matrix"
            });
        } else if (action === "UPDATE" && data.id) {
            await prisma.vendorVariety.update({
                where: { id: data.id },
                data: {
                    originStateId: data.originStateId,
                    leadTime: data.leadTime,
                    supplyCapacity: data.supplyCapacity,
                    qualityGrade: data.qualityGrade,
                    isBlacklisted: data.isBlacklisted
                }
            });
            await logActivity({
                action: "UPDATE",
                entityType: "VendorMatrix",
                entityId: data.id,
                details: "Updated vendor matrix entry"
            });
        } else if (action === "DELETE" && data.id) {
            await prisma.vendorVariety.delete({
                where: { id: data.id }
            });
            await logActivity({
                action: "DELETE",
                entityType: "VendorMatrix",
                entityId: data.id,
                details: "Removed from vendor matrix"
            });
        }

        revalidatePath("/matrix");
        return { success: true };
    } catch (error) {
        console.error("Failed to manage vendor variety:", error);
        return { success: false, error: "Operation failed" };
    }
}

export async function getMatrixAuxData() {
    try {
        const [vendors, varieties, states] = await Promise.all([
            prisma.company.findMany({
                where: { type: 'VENDOR', status: 'ACTIVE' },
                select: { id: true, name: true }
            }),
            prisma.commodityVariety.findMany({
                include: { commodity: { select: { name: true } } }
            }),
            prisma.state.findMany({
                select: { id: true, name: true },
                orderBy: { name: 'asc' }
            })
        ]);

        return {
            success: true,
            data: {
                vendors,
                varieties: varieties.map(v => ({ id: v.id, name: v.name, commodity: v.commodity })),
                states
            }
        };
    } catch (error: any) {
        console.error("Failed to fetch aux data:", error);
        return { success: false, error: `Failed to fetch options: ${error.message}` };
    }
}
