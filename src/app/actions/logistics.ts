'use server'

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { logActivity } from "./audit";

// --- Types ---
export type ShipmentData = {
    purchaseOrderId: string;
    carrier?: string;
    trackingNumber?: string;
    eta?: Date;
    notes?: string;
};

export type GRNData = {
    purchaseOrderId: string;
    receivedBy: string;
    totalReceivedQuantity: number;
    rejectedQuantity: number;
    acceptedQuantity: number;
    notes?: string;
    images?: string[];
    qualityCheckStatus: 'PASSED' | 'FAILED' | 'PENDING';
};

// --- Shipment Actions ---

export async function createShipment(data: ShipmentData) {
    try {
        const session = await auth();
        const shipment = await prisma.shipment.create({
            data: {
                createdById: session?.user?.id,
                updatedById: session?.user?.id,
                purchaseOrderId: data.purchaseOrderId,
                carrier: data.carrier,
                trackingNumber: data.trackingNumber,
                eta: data.eta,
                notes: data.notes,
                status: 'IN_TRANSIT'
            }
        });

        // Auto-update PO status to IN_TRANSIT if valid
        await prisma.purchaseOrder.update({
            where: { id: data.purchaseOrderId },
            data: { status: 'IN_TRANSIT' }
        });

        await logActivity({
            action: "CREATE",
            entityType: "Shipment",
            entityId: shipment.id,
            entityTitle: `Shipment for PO #${data.purchaseOrderId.slice(0, 8).toUpperCase()}`,
            details: `Created shipment via ${data.carrier || "Unknown"}`
        });

        revalidatePath(`/purchase-orders/${data.purchaseOrderId}`);
        return { success: true, data: shipment };
    } catch (error) {
        console.error("Failed to create shipment:", error);
        return { success: false, error: "Failed to create shipment" };
    }
}

export async function updateShipmentStatus(id: string, status: string) {
    try {
        const session = await auth();
        await prisma.shipment.update({
            where: { id },
            data: {
                status,
                updatedById: session?.user?.id
            }
        });

        await logActivity({
            action: "STATUS_CHANGE",
            entityType: "Shipment",
            entityId: id,
            entityTitle: `Shipment`,
            details: `Updated shipment status to ${status}`
        });

        revalidatePath('/logistics');
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to update shipment status" };
    }
}

// --- GRN Actions ---

export async function createGRN(data: GRNData) {
    try {
        const session = await auth();
        // 1. Create GRN Record
        const grn = await prisma.gRN.create({
            data: {
                createdById: session?.user?.id,
                updatedById: session?.user?.id,
                purchaseOrderId: data.purchaseOrderId,
                receivedBy: data.receivedBy,
                totalReceivedQuantity: data.totalReceivedQuantity,
                rejectedQuantity: data.rejectedQuantity,
                acceptedQuantity: data.acceptedQuantity,
                qualityCheckStatus: data.qualityCheckStatus,
                notes: data.notes,
                images: data.images || []
            }
        });

        // 2. Mark PO as RECEIVED
        const po = await prisma.purchaseOrder.update({
            where: { id: data.purchaseOrderId },
            data: { status: 'RECEIVED' },
            include: { project: true } // Need for project auto-complete check
        });

        // 3. Trigger Project Auto-Complete Logic (Simplified from procurement.ts)
        // We can reuse the logic or call a shared function. 
        // For now, let's just trigger revalidation, the procurement.ts logic ran on updatePurchaseOrderStatus.
        // But here we doing direct prisma update. We should ideally call updatePurchaseOrderStatus?
        // But updatePurchaseOrderStatus has restrictions.
        // Let's implement the auto-complete check here too for consistency.

        // Check if project is fulfilled
        if (po.project) {
            const project = await prisma.procurementProject.findUnique({
                where: { id: po.projectId },
                include: {
                    purchaseOrders: true,
                    salesOpportunities: true
                }
            });

            if (project) {
                const totalDemand = project.salesOpportunities
                    .filter(opp => opp.status === 'OPEN' || opp.status === 'CLOSED_WON')
                    .reduce((sum, opp) => sum + (Number(opp.procurementQuantity) || Number(opp.quantity) || 0), 0);

                const totalSupply = project.purchaseOrders
                    .filter(p => p.status === 'RECEIVED') // Only count receieved now? Or all active? usually all active.
                    // Wait, previous logic counted all active. Let's count all active (Supply).
                    .filter(p => p.status !== 'DRAFT')
                    .reduce((sum, p) => sum + (Number(p.quantity) || 0), 0);

                if (totalSupply >= totalDemand) {
                    await prisma.procurementProject.update({
                        where: { id: project.id },
                        data: { status: 'COMPLETED' }
                    });
                }
            }
        }

        revalidatePath(`/purchase-orders/${data.purchaseOrderId}`);
        revalidatePath('/logistics');

        return {
            success: true,
            data: {
                ...grn,
                totalReceivedQuantity: grn.totalReceivedQuantity.toNumber(),
                rejectedQuantity: grn.rejectedQuantity.toNumber(),
                acceptedQuantity: grn.acceptedQuantity.toNumber()
            }
        };

    } catch (error) {
        console.error("Failed to create GRN:", error);
        return { success: false, error: "Failed to create GRN" };
    }
}

export async function getShipments(filters?: {
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

        const [shipments, total] = await prisma.$transaction([
            prisma.shipment.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    createdBy: { select: { name: true } },
                    updatedBy: { select: { name: true } },
                    purchaseOrder: {
                        include: {
                            project: true,
                            vendor: true
                        }
                    }
                }
            }),
            prisma.shipment.count({ where })
        ]);

        // Sanitize decimals
        const safeShipments = shipments.map(s => ({
            ...s,
            purchaseOrder: {
                ...s.purchaseOrder,
                quantity: s.purchaseOrder.quantity?.toNumber(),
                totalAmount: s.purchaseOrder.totalAmount.toNumber()
            }
        }));

        return {
            success: true,
            data: safeShipments,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    } catch (error) {
        console.error("Failed to fetch shipments:", error);
        return { success: false, error: "Failed to fetch shipments" };
    }
}
