"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { SalesOrderStatus } from "@prisma/client";
import { auth } from "@/auth";

export async function createSalesOrder(opportunityId: string) {
    try {
        // 1. Fetch Opportunity and Approved Submissions
        const opportunity = await prisma.salesOpportunity.findUnique({
            where: { id: opportunityId },
            include: {
                company: true,
                sampleSubmissions: {
                    where: { status: 'CLIENT_APPROVED' },
                    include: {
                        sample: {
                            include: { vendor: true }
                        }
                    },
                    orderBy: { updatedAt: 'desc' }, // Get latest
                    take: 1
                }
            }
        });

        if (!opportunity) {
            return { success: false, error: "Opportunity not found" };
        }

        // 2. Validate Pre-requisites
        const approvedSubmission = opportunity.sampleSubmissions[0];
        if (!approvedSubmission) {
            return { success: false, error: "No Client Approved sample found to create order from." };
        }

        // 3. Calculate Amounts
        const price = opportunity.targetPrice?.toNumber() || 0;
        const qty = opportunity.quantity?.toNumber() || 0;

        let totalAmount = price * qty;

        if (opportunity.priceType === 'PER_KG') {
            totalAmount = price * (qty * 1000); // Convert MT to Kg
        } else if (opportunity.priceType === 'TOTAL_AMOUNT') {
            totalAmount = price;
        }

        // 4. Create Sales Order (PENDING) - Only create order, no project yet
        const session = await auth();
        const salesOrder = await prisma.salesOrder.create({
            data: {
                createdById: session?.user?.id,
                updatedById: session?.user?.id,
                opportunityId: opportunity.id,
                clientId: opportunity.company.id,
                totalAmount: totalAmount,
                status: 'PENDING'
            }
        });

        // 5. Close Opportunity
        await prisma.salesOpportunity.update({
            where: { id: opportunity.id },
            data: { status: 'CLOSED_WON' }
        });

        revalidatePath("/opportunities");
        revalidatePath("/sales-orders");

        return {
            success: true,
            data: {
                ...salesOrder,
                totalAmount: salesOrder.totalAmount.toNumber()
            }
        };
    } catch (error: any) {
        console.error("Failed to create sales order:", error);
        return { success: false, error: `Failed to create order: ${error.message}` };
    }
}

export async function getSalesOrders() {
    try {
        const orders = await prisma.salesOrder.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                client: true,
                opportunity: true
            }
        });

        const safeOrders = orders.map(order => ({
            ...order,
            totalAmount: order.totalAmount.toNumber(),
            opportunity: {
                ...order.opportunity,
                targetPrice: order.opportunity.targetPrice?.toNumber(),
                quantity: order.opportunity.quantity?.toNumber(),
                procurementQuantity: order.opportunity.procurementQuantity?.toNumber()
            }
        }));

        return { success: true, data: safeOrders };
    } catch (error: any) {
        console.error("Failed to fetch sales orders:", error);
        return { success: false, error: "Failed to fetch orders" };
    }
}

export async function getSalesOrder(id: string) {
    try {
        const order = await prisma.salesOrder.findUnique({
            where: { id },
            include: {
                client: true,
                invoices: true,
                opportunity: {
                    include: {
                        procurementProject: {
                            include: {
                                purchaseOrders: {
                                    include: {
                                        vendor: true,
                                        sample: true
                                    },
                                    orderBy: { createdAt: 'desc' }
                                }
                            }
                        },
                        sampleSubmissions: {
                            include: {
                                sample: {
                                    include: { vendor: true }
                                }
                            },
                            orderBy: { createdAt: 'desc' }
                        }
                    }
                }
            }
        });

        if (!order) return { success: false, error: "Order not found" };

        // Flatten samples logic
        const allSamples = order.opportunity.sampleSubmissions.map(sub => ({
            ...sub.sample,
            priceQuoted: sub.sample.priceQuoted?.toNumber(),
            vendor: sub.sample.vendor,
            submissionStatus: sub.status // Include status so we can show it
        }));

        const approvedSamples = allSamples.filter(s => s.submissionStatus === 'CLIENT_APPROVED');

        const safeOrder = {
            ...order,
            totalAmount: order.totalAmount.toNumber(),
            opportunity: {
                ...order.opportunity,
                targetPrice: order.opportunity.targetPrice?.toNumber(),
                quantity: order.opportunity.quantity?.toNumber(),
                procurementQuantity: order.opportunity.procurementQuantity?.toNumber(),
                procurementProject: order.opportunity.procurementProject ? {
                    ...order.opportunity.procurementProject,
                    purchaseOrders: order.opportunity.procurementProject.purchaseOrders.map(po => ({
                        ...po,
                        totalAmount: po.totalAmount.toNumber(),
                        quantity: po.quantity?.toNumber(),
                        sample: po.sample ? {
                            ...po.sample,
                            priceQuoted: po.sample.priceQuoted?.toNumber()
                        } : null
                    }))
                } : null,
                sampleSubmissions: order.opportunity.sampleSubmissions.map(sub => ({
                    ...sub,
                    sample: {
                        ...sub.sample,
                        priceQuoted: sub.sample.priceQuoted?.toNumber()
                    }
                }))
            },
            approvedSamples,
            approvedSample: approvedSamples[0] || null, // Keep for backward compatibility if needed temporarily
            purchaseOrders: order.opportunity.procurementProject?.purchaseOrders.map(po => ({
                ...po,
                totalAmount: po.totalAmount.toNumber(),
                quantity: po.quantity?.toNumber(),
                sample: po.sample ? {
                    ...po.sample,
                    priceQuoted: po.sample.priceQuoted?.toNumber()
                } : null
            })) || [],
            invoices: order.invoices.map(inv => ({
                ...inv,
                totalAmount: inv.totalAmount.toNumber(),
                pendingAmount: inv.pendingAmount.toNumber()
            }))
        };

        return { success: true, data: safeOrder };
    } catch (error: any) {
        console.error("Failed to fetch sales order:", error);
        return { success: false, error: "Failed to fetch order" };
    }
}

export async function updateSalesOrderStatus(id: string, status: SalesOrderStatus) {
    try {
        const session = await auth();
        const order = await prisma.salesOrder.update({
            where: { id },
            data: {
                status,
                updatedById: session?.user?.id
            },
            include: {
                opportunity: {
                    include: {
                        company: true,
                        procurementProject: true, // Check if exists
                        sampleSubmissions: {
                            where: { status: 'CLIENT_APPROVED' },
                            include: {
                                sample: { include: { vendor: true } }
                            },
                            take: 1
                        }
                    }
                }
            }
        });

        // Trigger Procurement Creation if IN_PROGRESS and Project doesn't exist (or isn't a Fulfillment project)
        const currentProject = order.opportunity.procurementProject;
        const hasFulfillmentProject = currentProject && currentProject.name.startsWith("Fulfillment:");

        if (status === 'IN_PROGRESS' && !hasFulfillmentProject) {
            const approvedSubmission = order.opportunity.sampleSubmissions[0];
            if (approvedSubmission) {
                const sample = approvedSubmission.sample;
                const qty = order.opportunity.quantity?.toNumber() || 0;

                // Create Project
                const project = await prisma.procurementProject.create({
                    data: {
                        name: `Fulfillment: ${order.opportunity.productName} - ${order.opportunity.company.name}`,
                        status: 'SOURCING'
                    }
                });

                // Link Project to Opportunity
                await prisma.salesOpportunity.update({
                    where: { id: order.opportunityId },
                    data: { procurementProjectId: project.id }
                });

                // Process All Approved Submissions (Multi-vendor support)
                const approvedSubmissions = order.opportunity.sampleSubmissions;
                const processedVendorIds = new Set<string>();

                for (const submission of approvedSubmissions) {
                    const sample = submission.sample;

                    // Link Vendor (avoid duplicates)
                    if (!processedVendorIds.has(sample.vendorId)) {
                        await prisma.projectVendor.create({
                            data: {
                                projectId: project.id,
                                vendorId: sample.vendorId
                            }
                        });
                        processedVendorIds.add(sample.vendorId);
                    }

                    // Create Draft PO
                    // Note: We create a PO for each approved sample. 
                    // Quantity is initialized to the full opportunity quantity for convenience, 
                    // but user should adjust if splitting orders.
                    const buyPrice = sample.priceQuoted?.toNumber() || 0;
                    let buyTotal = buyPrice * qty;

                    if (sample.priceUnit === 'PER_KG') {
                        buyTotal = buyPrice * (qty * 1000);
                    }

                    await prisma.purchaseOrder.create({
                        data: {
                            projectId: project.id,
                            vendorId: sample.vendorId,
                            sampleId: sample.id,
                            quantity: qty, // Initialize with full quantity
                            quantityUnit: 'MT', // Default to MT
                            totalAmount: buyTotal,
                            status: 'DRAFT',
                            createdById: session?.user?.id,
                            updatedById: session?.user?.id
                        }
                    });
                }
            }
        }

        revalidatePath("/sales-orders");
        revalidatePath(`/sales-orders/${id}`);
        revalidatePath("/procurement");
        revalidatePath("/purchase-orders");
        return {
            success: true, data: {
                ...order,
                totalAmount: order.totalAmount.toNumber(),
                opportunity: {
                    ...order.opportunity,
                    targetPrice: order.opportunity.targetPrice?.toNumber(),
                    quantity: order.opportunity.quantity?.toNumber(),
                    procurementQuantity: order.opportunity.procurementQuantity?.toNumber(),
                    procurementProject: order.opportunity.procurementProject ? {
                        ...order.opportunity.procurementProject,
                    } : null,
                    sampleSubmissions: order.opportunity.sampleSubmissions.map(sub => ({
                        ...sub,
                        sample: {
                            ...sub.sample,
                            priceQuoted: sub.sample.priceQuoted?.toNumber()
                        }
                    }))
                }
            }
        };
    } catch (error: any) {
        console.error("Failed to update status:", error);
        return { success: false, error: "Failed to update status" };
    }
}
