'use server'

import { prisma } from "@/lib/prisma";
import { ProjectStatus, PurchaseOrderStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export type ProcurementProjectFormData = {
    name: string;
    status?: ProjectStatus;
    commodityId?: string; // NEW
};

export async function getProcurementProjects(filters?: {
    location?: string;
    commodityId?: string;
    trustLevel?: string;
    page?: number;
    limit?: number;
    query?: string;
    status?: string;
}) {
    try {
        const where: any = {};
        const page = filters?.page || 1;
        const limit = filters?.limit || 10;
        const skip = (page - 1) * limit;

        if (filters?.query) {
            const search = filters.query.trim();
            where.name = { contains: search, mode: "insensitive" };
        }

        if (filters?.status && filters.status !== 'all') {
            where.status = filters.status;
        }

        if (filters?.commodityId && filters.commodityId !== 'all') {
            where.commodityId = filters.commodityId;
        }

        if (filters?.location || (filters?.trustLevel && filters.trustLevel !== 'all')) {
            where.projectVendors = {
                some: {
                    vendor: {
                        AND: [
                            filters?.location ? {
                                OR: [
                                    { city: { name: { contains: filters.location, mode: 'insensitive' } } },
                                    { state: { name: { contains: filters.location, mode: 'insensitive' } } },
                                    { country: { name: { contains: filters.location, mode: 'insensitive' } } }
                                ]
                            } : {},
                            (filters?.trustLevel && filters.trustLevel !== 'all') ? {
                                trustLevel: filters.trustLevel as any
                            } : {}
                        ]
                    }
                }
            };
        }

        const [projects, total] = await prisma.$transaction([
            prisma.procurementProject.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
                include: {
                    _count: {
                        select: {
                            projectVendors: true,
                            salesOpportunities: true,
                            samples: true,
                            purchaseOrders: true
                        }
                    },
                    commodity: true,
                    projectVendors: {
                        include: {
                            vendor: true
                        }
                    },
                    salesOpportunities: {
                        select: {
                            id: true,
                            quantity: true,
                            procurementQuantity: true,
                            status: true
                        }
                    },
                    purchaseOrders: {
                        select: {
                            id: true,
                            quantity: true,
                            status: true
                        }
                    }
                }
            }),
            prisma.procurementProject.count({ where })
        ]);

        const safeProjects = projects.map(p => ({
            ...p,
            salesOpportunities: p.salesOpportunities.map(opp => ({
                ...opp,
                quantity: opp.quantity?.toNumber() || 0,
                procurementQuantity: opp.procurementQuantity?.toNumber() || 0
            })),
            purchaseOrders: p.purchaseOrders.map(po => ({
                ...po,
                quantity: po.quantity?.toNumber() || 0
            }))
        }));

        return {
            success: true,
            data: safeProjects,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    } catch (error) {
        console.error("Failed to get procurement projects:", error);
        return { success: false, error: "Failed to fetch procurement projects" };
    }
}

export async function createProcurementProject(data: ProcurementProjectFormData) {
    try {
        const session = await auth();
        const project = await prisma.procurementProject.create({
            data: {
                createdById: session?.user?.id,
                updatedById: session?.user?.id,
                name: data.name,
                status: data.status || "SOURCING",
                commodityId: data.commodityId // NEW
            }
        });

        revalidatePath("/procurement");
        return { success: true, data: project };
    } catch (error) {
        console.error("Failed to create procurement project:", error);
        return { success: false, error: "Failed to create procurement project" };
    }
}

export async function updateProcurementProject(id: string, data: ProcurementProjectFormData) {
    try {
        const session = await auth();
        const project = await prisma.procurementProject.update({
            where: { id },
            data: {
                updatedById: session?.user?.id,
                name: data.name,
                status: data.status,
                commodityId: data.commodityId
            }
        });

        revalidatePath("/procurement");
        revalidatePath(`/procurement/${id}`);
        return { success: true, data: project };
    } catch (error) {
        console.error("Failed to update procurement project:", error);
        return { success: false, error: "Failed to update procurement project" };
    }
}

export async function deleteProcurementProject(id: string) {
    try {
        const session = await auth();
        // Check for dependencies
        const project = await prisma.procurementProject.findUnique({
            where: { id },
            include: {
                purchaseOrders: true,
                samples: {
                    select: { id: true }
                }
            }
        });

        if (!project) return { success: false, error: "Project not found" };

        // 1. Block if Purchase Orders exist (Safety check)
        if (project.purchaseOrders.length > 0) {
            return {
                success: false,
                error: `Cannot delete project with ${project.purchaseOrders.length} existing Purchase Order(s). Please delete them first.`
            };
        }

        await prisma.$transaction(async (tx) => {
            // 2. Unlink Sales Opportunities
            await tx.salesOpportunity.updateMany({
                where: { procurementProjectId: id },
                data: {
                    procurementProjectId: null,
                    // Optional: Revert status if needed, but keeping it simple for now
                    // status: 'OPEN' // Consider if we should revert status
                }
            });

            // 3. Delete Project Vendors
            await tx.projectVendor.deleteMany({
                where: { projectId: id }
            });

            // 4. Delete Sample Submissions & Samples
            const sampleIds = project.samples.map(s => s.id);
            if (sampleIds.length > 0) {
                await tx.sampleSubmission.deleteMany({
                    where: { sampleId: { in: sampleIds } }
                });

                // Also need to handle PurchaseOrders if they link to Samples? 
                // We checked POs on the project, but what if a PO from ANOTHER project links to this sample?
                // Unlikely given the schema structure, but theoretically possible if sampleId is just a link.
                // However, sample.projectId connects it to THIS project.

                await tx.sampleRecord.deleteMany({
                    where: { projectId: id }
                });
            }

            // 5. Delete the Project
            await tx.procurementProject.delete({
                where: { id }
            });
        });

        revalidatePath("/procurement");
        return { success: true };
    } catch (error: any) {
        console.error("Failed to delete procurement project:", error);
        return { success: false, error: `Failed to delete project: ${error.message}` };
    }
}

export async function getProcurementProject(id: string) {
    try {
        const project = await prisma.procurementProject.findUnique({
            where: { id },
            include: {
                projectVendors: {
                    include: {
                        vendor: {
                            include: {
                                city: true,
                                country: true
                            }
                        }
                    }
                },
                salesOpportunities: {
                    include: {
                        company: true,
                        sampleSubmissions: {
                            include: {
                                sample: {
                                    include: {
                                        vendor: true
                                    }
                                }
                            }
                        }
                    }
                },
                samples: {
                    include: {
                        vendor: true,
                        submissions: {
                            include: {
                                opportunity: {
                                    include: {
                                        company: true,
                                        sampleSubmissions: {
                                            include: {
                                                sample: {
                                                    include: {
                                                        vendor: true
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    orderBy: {
                        id: 'desc'
                    }
                },
                purchaseOrders: {
                    include: {
                        vendor: true
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                }
            }
        });

        if (!project) {
            return { success: false, error: "Project not found" };
        }

        // Sanitize decimals
        const safeProject = {
            ...project,
            salesOpportunities: project.salesOpportunities.map(opp => ({
                ...opp,
                targetPrice: opp.targetPrice?.toNumber(),
                quantity: opp.quantity?.toNumber(),
                procurementQuantity: opp.procurementQuantity?.toNumber(), // NEW
                sampleSubmissions: (opp.sampleSubmissions || []).map((sub: any) => ({ // Type cast if needed
                    ...sub,
                    sample: {
                        ...sub.sample,
                        priceQuoted: sub.sample?.priceQuoted?.toNumber()
                    }
                }))
            })),
            samples: project.samples.map(sample => ({
                ...sample,
                priceQuoted: sample.priceQuoted?.toNumber(),
                submissions: (sample.submissions || []).map(sub => ({
                    ...sub,
                    opportunity: {
                        ...sub.opportunity,
                        targetPrice: sub.opportunity?.targetPrice?.toNumber(),
                        quantity: sub.opportunity?.quantity?.toNumber(),
                        procurementQuantity: sub.opportunity?.procurementQuantity?.toNumber(),
                        sampleSubmissions: (sub.opportunity?.sampleSubmissions || []).map((nestedSub: any) => ({
                            ...nestedSub,
                            sample: {
                                ...nestedSub.sample,
                                priceQuoted: nestedSub.sample?.priceQuoted?.toNumber()
                            }
                        }))
                    }
                }))
            })),
            purchaseOrders: (project.purchaseOrders || []).map((po: any) => ({
                ...po,
                totalAmount: po.totalAmount.toNumber(),
                quantity: po.quantity?.toNumber()
            }))
        };

        return { success: true, data: safeProject };
    } catch (error) {
        console.error("Failed to get procurement project:", error);
        return { success: false, error: "Failed to fetch procurement project" };
    }
}

export async function getUnassignedOpportunities() {
    try {
        const opportunities = await prisma.salesOpportunity.findMany({
            where: {
                procurementProjectId: null,
                status: "OPEN"
            },
            include: {
                company: true
            },
            orderBy: { createdAt: "desc" }
        });

        const safeOpportunities = opportunities.map(opp => ({
            ...opp,
            targetPrice: opp.targetPrice?.toNumber() || 0,
            quantity: opp.quantity?.toNumber() || 0,
            procurementQuantity: opp.procurementQuantity?.toNumber() || 0
        }));

        return { success: true, data: safeOpportunities };
    } catch (error) {
        console.error("Failed to fetch unassigned opportunities:", error);
        return { success: false, error: "Failed to fetch opportunities" };
    }
}

export async function linkOpportunityToProject(projectId: string, opportunityId: string) {
    try {
        await prisma.salesOpportunity.update({
            where: { id: opportunityId },
            data: { procurementProjectId: projectId }
        });

        revalidatePath(`/procurement/${projectId}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to link opportunity:", error);
        return { success: false, error: "Failed to link opportunity" };
    }
}

export async function getAvailableVendors(projectId: string) {
    try {
        // First get the project to check its commodity
        const project = await prisma.procurementProject.findUnique({
            where: { id: projectId },
            select: { commodityId: true }
        });

        // Get vendors NOT already linked to this project
        // AND match the commodity if project has one
        const where: any = {
            type: "VENDOR",
            projectVendors: {
                none: {
                    projectId: projectId
                }
            },
            status: "ACTIVE"
        };

        if (project?.commodityId) {
            where.commodities = {
                some: {
                    id: project.commodityId
                }
            };
        }

        const vendors = await prisma.company.findMany({
            where,
            orderBy: { name: "asc" },
            include: {
                city: true,
                state: true,
                country: true
            }
        });
        return { success: true, data: vendors };
    } catch (error) {
        console.error("Failed to fetch available vendors:", error);
        return { success: false, error: "Failed to fetch vendors" };
    }
}

export async function addVendorToProject(projectId: string, vendorId: string) {
    try {
        await prisma.projectVendor.create({
            data: {
                projectId,
                vendorId
            }
        });

        revalidatePath(`/procurement/${projectId}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to add vendor:", error);
        return { success: false, error: "Failed to add vendor to project" };
    }
}

export async function getPurchaseOrders(filters?: {
    page?: number;
    limit?: number;
}) {
    try {
        const page = filters?.page || 1;
        const limit = filters?.limit || 10;
        const skip = (page - 1) * limit;

        const [orders, total] = await prisma.$transaction([
            prisma.purchaseOrder.findMany({
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
                include: {
                    vendor: true,
                    project: true,
                    sample: true
                }
            }),
            prisma.purchaseOrder.count()
        ]);

        // Deserialize decimals
        const safeOrders = orders.map(order => ({
            ...order,
            totalAmount: order.totalAmount.toNumber(),
            quantity: order.quantity?.toNumber(),
            sample: order.sample ? {
                ...order.sample,
                priceQuoted: order.sample.priceQuoted?.toNumber()
            } : null
        }));

        return {
            success: true,
            data: safeOrders,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    } catch (error) {
        console.error("Failed to fetch purchase orders:", error);
        return { success: false, error: "Failed to fetch purchase orders" };
    }
}

export async function getPurchaseOrder(id: string) {
    try {
        const order = await prisma.purchaseOrder.findUnique({
            where: { id },
            include: {
                vendor: { include: { country: true, state: true, city: true } },
                project: {
                    include: {
                        salesOpportunities: {
                            include: {
                                sampleSubmissions: {
                                    where: { status: 'CLIENT_APPROVED' },
                                    include: { sample: { include: { vendor: true } } },
                                    orderBy: { createdAt: 'desc' }
                                }
                            }
                        }
                    }
                },
                sample: { include: { vendor: true } },
                bills: true,
                shipments: true,
                grn: true
            }
        });

        if (!order) return { success: false, error: "Purchase Order not found" };

        // Collect all approved samples from related opportunities
        const rawSamples = order.project.salesOpportunities.flatMap(op =>
            op.sampleSubmissions.map(sub => sub.sample)
        );

        // Deduplicate samples by ID
        const candidateSamples = Array.from(
            new Map(rawSamples.map(sample => [sample.id, sample])).values()
        );

        const safeOrder = {
            ...order,
            project: {
                ...order.project,
                salesOpportunities: order.project.salesOpportunities.map(opp => ({
                    ...opp,
                    targetPrice: opp.targetPrice?.toNumber(),
                    quantity: opp.quantity?.toNumber(),
                    procurementQuantity: opp.procurementQuantity?.toNumber(),
                    sampleSubmissions: opp.sampleSubmissions.map(sub => ({
                        ...sub,
                        sample: {
                            ...sub.sample,
                            priceQuoted: sub.sample.priceQuoted?.toNumber(),
                            vendor: sub.sample.vendor
                        }
                    }))
                }))
            },
            vendor: order.vendor,
            totalAmount: order.totalAmount.toNumber(),
            quantity: order.quantity?.toNumber(),
            quantityUnit: order.quantityUnit,
            sample: order.sample ? {
                ...order.sample,
                priceQuoted: order.sample.priceQuoted?.toNumber(),
                vendor: order.sample.vendor
            } : null,
            bills: order.bills.map(bill => ({
                ...bill,
                totalAmount: bill.totalAmount.toNumber(),
                pendingAmount: bill.pendingAmount.toNumber()
            })),
            shipments: order.shipments,
            grn: order.grn ? {
                ...order.grn,
                totalReceivedQuantity: order.grn.totalReceivedQuantity.toNumber(),
                rejectedQuantity: order.grn.rejectedQuantity.toNumber(),
                acceptedQuantity: order.grn.acceptedQuantity.toNumber()
            } : null,
            candidateSamples: candidateSamples.map(sample => ({
                ...sample,
                priceQuoted: sample.priceQuoted?.toNumber(),
                vendor: sample.vendor
            }))
        };

        return { success: true, data: safeOrder };
    } catch (error) {
        console.error("Failed to fetch purchase order:", error);
        return { success: false, error: "Failed to fetch purchase order" };
    }
}

export async function setPurchaseOrderSample(poId: string, sampleId: string) {
    try {
        await prisma.purchaseOrder.update({
            where: { id: poId },
            data: { sampleId }
        });
        revalidatePath(`/purchase-orders/${poId}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to set PO sample:", error);
        return { success: false, error: "Failed to update sample" };
    }
}

export async function updatePurchaseOrderStatus(id: string, status: PurchaseOrderStatus) {
    try {
        // Fetch Order with Project Context to validate fulfillment
        const order = await prisma.purchaseOrder.findUnique({
            where: { id },
            include: {
                project: {
                    include: {
                        salesOpportunities: true,
                        purchaseOrders: true
                    }
                }
            }
        });

        if (!order) return { success: false, error: "Order not found" };

        // If trying to mark as RECEIVED (Completed)
        if (status === 'RECEIVED' && order.status !== 'RECEIVED') {
            const project = order.project;

            // 1. Calculate stats
            const totalDemand = project.salesOpportunities
                .filter((opp: any) => opp.status === 'OPEN' || opp.status === 'CLOSED_WON')
                .reduce((sum: number, opp: any) => sum + (Number(opp.procurementQuantity) || Number(opp.quantity) || 0), 0);

            const otherProcured = project.purchaseOrders
                .filter((po: any) => po.id !== id && po.status !== 'CANCELLED')
                .reduce((sum: number, po: any) => sum + (Number(po.quantity) || 0), 0);

            const currentQuantity = Number(order.quantity) || 0;

            // 2. RESTRICT: If demand is ALREADY met by others
            if (otherProcured >= totalDemand) {
                return {
                    success: false,
                    error: `Project requirement (${totalDemand} MT) already fulfilled by other ${project.purchaseOrders.length - 1} orders.`
                };
            }

            // 3. AUTO-COMPLETE PROJECT: If this PO fulfills the remaining demand
            if (otherProcured + currentQuantity >= totalDemand) {
                await prisma.procurementProject.update({
                    where: { id: project.id },
                    data: { status: 'COMPLETED' }
                });
            }
        }

        const session = await auth();
        await prisma.purchaseOrder.update({
            where: { id },
            data: {
                status,
                updatedById: session?.user?.id
            }
        });

        // If status is RECEIVED, update linked shipments
        if (status === 'RECEIVED') {
            await prisma.shipment.updateMany({
                where: {
                    purchaseOrderId: id,
                    status: { not: "DELIVERED" }
                },
                data: {
                    status: "DELIVERED",
                    actualDeliveryDate: new Date()
                }
            });
            revalidatePath("/logistics");
        }

        revalidatePath('/purchase-orders');
        revalidatePath(`/purchase-orders/${id}`);
        revalidatePath(`/procurement/${order.projectId}`); // Refresh project page to show status
        return { success: true };
    } catch (error) {
        console.error("Failed to update PO status:", error);
        return { success: false, error: "Failed to update status" };
    }
}

export async function createBill(data: {
    purchaseOrderId: string;
    vendorId: string;
    totalAmount: number;
    invoiceNumber?: string;
    date: Date;
}) {
    try {
        const invoiceNumber = data.invoiceNumber || `BILL-${Date.now().toString().slice(-6)}`;
        const session = await auth();

        const bill = await prisma.bill.create({
            data: {
                createdById: session?.user?.id,
                updatedById: session?.user?.id,
                purchaseOrderId: data.purchaseOrderId,
                vendorId: data.vendorId,
                totalAmount: data.totalAmount,
                invoiceNumber: invoiceNumber,
                createdAt: data.date,
                status: 'DRAFT',
                pendingAmount: data.totalAmount // Initialize pending amount
            }
        });

        revalidatePath(`/purchase-orders/${data.purchaseOrderId}`);
        return {
            success: true,
            data: {
                ...bill,
                totalAmount: bill.totalAmount.toNumber(),
                pendingAmount: bill.pendingAmount.toNumber()
            }
        };
    } catch (error: any) {
        console.error("Failed to create bill:", error);
        return { success: false, error: error.message || "Failed to create bill" };
    }
}

export async function updatePurchaseOrderPdf(id: string, url: string) {
    try {
        const order = await prisma.purchaseOrder.update({
            where: { id },
            data: { pdfUrl: url },
        });
        revalidatePath(`/purchase-orders/${id}`);

        return {
            success: true,
            data: {
                ...order,
                totalAmount: order.totalAmount.toNumber(),
                quantity: order.quantity?.toNumber()
            }
        };
    } catch (error) {
        console.error("Failed to update PO PDF:", error);
        return { success: false, error: "Failed to update PDF" };
    }
}


export async function createManualPurchaseOrder(data: {
    projectId: string;
    vendorId: string;
    totalAmount: number;
    status: PurchaseOrderStatus;
    sampleId?: string; // Optional
    quantity?: number; // NEW
    quantityUnit?: string; // NEW
}) {
    try {
        const session = await auth();
        const order = await prisma.purchaseOrder.create({
            data: {
                createdById: session?.user?.id,
                updatedById: session?.user?.id,
                projectId: data.projectId,
                vendorId: data.vendorId,
                totalAmount: data.totalAmount,
                status: data.status,
                sampleId: data.sampleId,
                quantity: data.quantity,
                quantityUnit: data.quantityUnit
            }
        });

        revalidatePath("/purchase-orders");
        revalidatePath("/procurement");
        revalidatePath(`/procurement/${data.projectId}`);

        return {
            success: true,
            data: {
                ...order,
                totalAmount: order.totalAmount.toNumber(),
                quantity: order.quantity?.toNumber()
            }
        };
    } catch (error: any) {
        console.error("Failed to create manual PO:", JSON.stringify(error, null, 2));
        if (error.code) console.error("Prisma Error Code:", error.code);
        if (error.meta) console.error("Prisma Error Meta:", error.meta);
        return { success: false, error: `Failed to create purchase order: ${error.message || "Unknown error"}` };
    }
}

export async function deletePurchaseOrder(id: string) {
    try {
        await prisma.purchaseOrder.delete({
            where: { id }
        });
        revalidatePath("/purchase-orders");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete PO:", error);
        return { success: false, error: "Failed to delete purchase order" };
    }
}

export async function updatePurchaseOrder(id: string, data: {
    totalAmount: number;
    quantity?: number;
    quantityUnit?: string;
    status?: PurchaseOrderStatus;
}) {
    try {
        const session = await auth();
        const order = await prisma.purchaseOrder.update({
            where: { id },
            data: {
                updatedById: session?.user?.id,
                totalAmount: data.totalAmount,
                quantity: data.quantity,
                quantityUnit: data.quantityUnit,
                status: data.status
            }
        });

        revalidatePath("/purchase-orders");
        revalidatePath(`/purchase-orders/${id}`);

        // If PO is marked as RECEIVED, also update any associated shipments to DELIVERED
        if (data.status === "RECEIVED") {
            await prisma.shipment.updateMany({
                where: {
                    purchaseOrderId: id,
                    status: { not: "DELIVERED" }
                },
                data: {
                    status: "DELIVERED",
                    actualDeliveryDate: new Date()
                }
            });
            revalidatePath("/logistics");
        }

        return { success: true, data: order };
    } catch (error) {
        console.error("Failed to update PO:", error);
        return { success: false, error: "Failed to update purchase order" };
    }
}
