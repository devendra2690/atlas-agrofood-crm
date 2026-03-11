'use server'

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { logActivity } from "./audit";

// --- Types ---
export type ShipmentData = {
    purchaseOrderId?: string;
    salesOrderId?: string;
    carrier?: string;
    trackingNumber?: string;
    quantity?: number;
    quantityUnit?: string;
    eta?: Date;
    notes?: string;
    sampleRecordId?: string;
    courierCharge?: number;
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

// ... existing code ...

export async function createShipment(data: ShipmentData) {
    try {
        const session = await auth();
        
        let validUserId = undefined;
        if (session?.user?.id) {
            const userExists = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true } });
            if (!userExists) {
                return { success: false, error: "Authentication mismatch: Your browser session is from a different environment. Please Log Out and Log In again." };
            }
            validUserId = session.user.id;
        }

        if (data.salesOrderId) {
            // SALES ORDER LOGIC
            const salesOrder = await prisma.salesOrder.findUnique({
                where: { id: data.salesOrderId },
                include: {
                    invoices: true,
                    shipments: true,
                    opportunity: { include: { items: true } },
                    client: { select: { name: true } }
                }
            });

            if (!salesOrder) return { success: false, error: "Sales Order not found" };

            // Strict Check: Must have at least one invoice
            if (salesOrder.invoices.length === 0) {
                return { success: false, error: "Cannot ship order. Please generate an Invoice first." };
            }

            if (!data.carrier) return { success: false, error: "Carrier / Logistics Provider is required." };
            if (!data.quantity) return { success: false, error: "Shipment Quantity is required." };

            // QUANTITY VALIDATION
            if (data.quantity) {
                const totalQuantity = salesOrder.opportunity?.items?.reduce((sum: number, it: any) => {
                    const parsedQty = typeof it.quantity?.toNumber === 'function' ? it.quantity.toNumber() : Number(it.quantity || 0);
                    return sum + (it.quantityUnit === 'KG' ? (parsedQty / 1000) : parsedQty);
                }, 0) || 0;

                const currentShipped = salesOrder.shipments.reduce((sum: any, s: any) => sum + (s.quantity?.toNumber() || 0), 0);
                // Normalize the proposed New Shipment into MT for mathematical comparison
                const shipmentQuantityInMT = data.quantityUnit === 'KG' ? (data.quantity / 1000) : data.quantity;
                const newTotal = currentShipped + shipmentQuantityInMT;

                // Tolerance for floating point?
                const isMismatch = Math.abs(newTotal - totalQuantity) > 0.001;

                if (isMismatch && !data.notes) {
                    return {
                        success: false,
                        error: `Quantity Mismatch: Shipping ${Number(newTotal.toFixed(3))} MT total (Order: ${Number(totalQuantity.toFixed(3))} MT). Please add a Note explaining the difference.`
                    };
                }
            }

            // 2. Create Shipment
            const shipment = await prisma.shipment.create({
                data: {
                    createdById: validUserId,
                    updatedById: validUserId,
                    salesOrderId: data.salesOrderId,
                    carrier: data.carrier,
                    trackingNumber: data.trackingNumber,
                    quantity: data.quantity,
                    eta: data.eta,
                    notes: data.notes,
                    status: 'IN_TRANSIT'
                }
            });

            // 2b. Optional Courier Charges (Out of pocket operations expense)
            if (data.courierCharge && data.courierCharge > 0) {
                await prisma.transaction.create({
                    data: {
                        createdById: validUserId,
                        updatedById: validUserId,
                        type: 'DEBIT',
                        amount: data.courierCharge,
                        category: 'Logistics',
                        description: `Courier charges for Outbound Shipment to ${salesOrder.client?.name || 'Unknown Client'} (SO #${data.salesOrderId.slice(0, 8).toUpperCase()})`,
                        salesOrderId: data.salesOrderId
                    }
                });
            }

            // 3. Auto-update SO status to SHIPPED (if not already further along)
            if (['PENDING', 'CONFIRMED', 'IN_PROGRESS'].includes(salesOrder.status)) {
                await prisma.salesOrder.update({
                    where: { id: data.salesOrderId },
                    data: { status: 'SHIPPED' } // We allow this even if partial, as long as notes explained it.
                });
            }

            await logActivity({
                action: "CREATE",
                entityType: "Shipment",
                entityId: shipment.id,
                entityTitle: `Shipment for SO #${salesOrder.id.slice(0, 8).toUpperCase()}`,
                details: `Created outbound shipment via ${data.carrier || "Unknown"}`
            });

            revalidatePath(`/sales-orders/${data.salesOrderId}`);
            return {
                success: true,
                data: {
                    ...shipment,
                    quantity: shipment.quantity ? shipment.quantity.toNumber() : null
                }
            };

        } else if (data.purchaseOrderId) {
            // PURCHASE ORDER LOGIC
            const shipment = await prisma.shipment.create({
                data: {
                    createdById: validUserId,
                    updatedById: validUserId,
                    purchaseOrderId: data.purchaseOrderId,
                    carrier: data.carrier,
                    trackingNumber: data.trackingNumber,
                    eta: data.eta,
                    notes: data.notes,
                    status: 'IN_TRANSIT'
                }
            });

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
            return {
                success: true,
                data: {
                    ...shipment,
                    quantity: shipment.quantity ? shipment.quantity.toNumber() : null
                }
            };
        } else if (data.sampleRecordId) {
            // SAMPLE LOGIC
            const sampleRecord = await prisma.sampleRecord.findUnique({
                where: { id: data.sampleRecordId },
                include: { vendor: { select: { name: true }} }
            });

            if (!sampleRecord) return { success: false, error: "Sample Record not found" };

            const shipment = await prisma.shipment.create({
                data: {
                    createdById: validUserId,
                    updatedById: validUserId,
                    sampleRecordId: data.sampleRecordId,
                    carrier: data.carrier,
                    trackingNumber: data.trackingNumber,
                    eta: data.eta,
                    notes: data.notes,
                    status: 'IN_TRANSIT'
                }
            });

            // If a courier charge is provided, record it as an Operations Expense
            if (data.courierCharge && data.courierCharge > 0) {
                await prisma.transaction.create({
                    data: {
                        createdById: validUserId,
                        updatedById: validUserId,
                        type: 'DEBIT',
                        amount: data.courierCharge,
                        category: 'Logistics',
                        description: `Courier charges for Sample Shipment from ${sampleRecord.vendor?.name || 'Unknown Supplier'} (${data.carrier || 'No Carrier'})`,
                    }
                });
            }

            if (sampleRecord.status === 'REQUESTED') {
                await prisma.sampleRecord.update({
                    where: { id: data.sampleRecordId },
                    data: { status: 'SENT' }
                });
            }

            // Also log the activity
            await logActivity({
                action: "CREATE",
                entityType: "Shipment",
                entityId: shipment.id,
                entityTitle: `Shipment for Sample #${data.sampleRecordId.slice(0, 8).toUpperCase()}`,
                details: `Created sample shipment via ${data.carrier || "Unknown"}${data.courierCharge ? ` (Cost: ₹${data.courierCharge})` : ''}`
            });

            revalidatePath(`/procurement`);
            return {
                success: true,
                data: shipment
            };
        } else {
            return { success: false, error: "Target order ID missing" };
        }

    } catch (error: any) {
        console.error("Failed to create shipment:", error);
        return { success: false, error: "Error: " + (error.message || "Unknown server error") };
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

export async function updateShipmentDocument(shipmentId: string, url: string, action: 'add' | 'remove') {
    try {
        const session = await auth();
        
        const shipment = await prisma.shipment.findUnique({
            where: { id: shipmentId }
        });

        if (!shipment) return { success: false, error: "Shipment not found" };

        let updatedDocuments = [...(shipment.documents || [])];

        if (action === 'add') {
            updatedDocuments.push(url);
        } else if (action === 'remove') {
            updatedDocuments = updatedDocuments.filter(d => d !== url);
        }

        await prisma.shipment.update({
            where: { id: shipmentId },
            data: {
                documents: updatedDocuments,
                updatedById: session?.user?.id
            }
        });

        await logActivity({
            action: "UPDATE",
            entityType: "Shipment",
            entityId: shipmentId,
            entityTitle: `Shipment`,
            details: `${action === 'add' ? 'Added' : 'Removed'} document attachment on shipment.`
        });

        revalidatePath('/logistics');
        revalidatePath(`/sales-orders/${shipment.salesOrderId}`);
        revalidatePath(`/purchase-orders/${shipment.purchaseOrderId}`);
        
        return { success: true };
    } catch (error: any) {
        console.error("Failed to update shipment documents:", error);
        return { success: false, error: "Failed to update documents" };
    }
}

// --- GRN Actions ---

export async function createGRN(data: GRNData) {
    try {
        const session = await auth();

        // 0. Prerequisite Check
        const checkPO = await prisma.purchaseOrder.findUnique({
            where: { id: data.purchaseOrderId },
            include: { bills: true, shipments: true }
        });

        if (!checkPO) return { success: false, error: "Purchase Order not found" };
        if (checkPO.bills.length === 0) return { success: false, error: "Cannot receive goods: Please add a Bill first." };
        // if (checkPO.shipments.length === 0) return { success: false, error: "Cannot receive goods: Please add a Shipment first." }; 
        // Note: Sometimes GRN creates the shipment logic implicitly in some systems, but strict req requested.
        if (checkPO.shipments.length === 0) return { success: false, error: "Cannot receive goods: Please add a Shipment first." };

        // New Check: Must have a Bill
        if (checkPO.bills.length === 0) {
            return { success: false, error: "Cannot receive goods: Please add a Bill first." };
        }

        // New Check: Shipment must be DELIVERED
        if (checkPO.shipments.some(s => s.status !== 'DELIVERED')) {
            return { success: false, error: "Cannot receive goods: Shipment is not in DELIVERED status." };
        }

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
                    purchaseOrders: { include: { items: true } },
                    salesOpportunities: { include: { items: true } }
                }
            });

            if (project) {
                const totalDemand = project.salesOpportunities
                    .filter((opp: any) => opp.status === 'OPEN' || opp.status === 'CLOSED_WON')
                    .reduce((sum: any, opp: any) => sum + (opp.items?.reduce((s: any, it: any) => s + (Number(it.procurementQuantity) || Number(it.quantity) || 0), 0) || 0), 0);

                const totalSupply = project.purchaseOrders
                    .filter(p => p.status === 'RECEIVED')
                    .filter(p => p.status !== 'DRAFT')
                    .reduce((sum, p) => sum + (p.items?.reduce((s: number, it: any) => s + (Number(it.quantity) || 0), 0) || 0), 0);

                if (totalSupply >= totalDemand) {
                    await prisma.procurementProject.update({
                        where: { id: project.id },
                        data: { status: 'COMPLETED' }
                    });
                }
            }
        }

        await logActivity({
            action: "CREATE",
            entityType: "GRN",
            entityId: grn.id,
            details: `Created GRN for PO #${po.id.slice(0, 8).toUpperCase()} - Received: ${data.totalReceivedQuantity}, Accepted: ${data.acceptedQuantity}`
        });

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
                            items: true,
                            project: true,
                            vendor: true
                        }
                    },
                    salesOrder: {
                        include: {
                            client: true,
                            opportunity: { include: { items: true } }
                        }
                    },
                    sampleRecord: {
                        include: { vendor: true }
                    }
                }
            }),
            prisma.shipment.count({ where })
        ]);

        // Sanitize decimals
        const safeShipments = shipments.map(s => ({
            ...s,
            quantity: s.quantity?.toNumber(),
            purchaseOrder: s.purchaseOrder ? {
                ...s.purchaseOrder,
                items: s.purchaseOrder.items?.map((it: any) => ({
                    ...it,
                    quantity: it.quantity?.toNumber() || 0,
                    rate: it.rate?.toNumber() || 0,
                    amount: it.amount?.toNumber() || 0
                })) || [],
                quantity: s.purchaseOrder.items?.reduce((sum: number, it: any) => sum + (it.quantity?.toNumber() || 0), 0) || 0,
                totalAmount: s.purchaseOrder.totalAmount?.toNumber() || 0
            } : null,
            salesOrder: s.salesOrder ? {
                ...s.salesOrder,
                totalAmount: s.salesOrder.totalAmount.toNumber(),
                opportunity: {
                    ...s.salesOrder.opportunity,
                    items: s.salesOrder.opportunity?.items?.map((it: any) => ({
                        ...it,
                        quantity: typeof it.quantity?.toNumber === 'function' ? it.quantity.toNumber() : Number(it.quantity || 0),
                        targetPrice: typeof it.targetPrice?.toNumber === 'function' ? it.targetPrice.toNumber() : Number(it.targetPrice || 0),
                        procurementQuantity: typeof it.procurementQuantity?.toNumber === 'function' ? it.procurementQuantity.toNumber() : Number(it.procurementQuantity || 0)
                    })) || []
                }
            } : null,
            sampleRecord: s.sampleRecord || null
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
