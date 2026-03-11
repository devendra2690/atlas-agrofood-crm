"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { SalesOrderStatus } from "@prisma/client";
import { auth } from "@/auth";
import { logActivity } from "./audit";
import { sendOrderConfirmationEmail } from "./email";

export async function createSalesOrder(opportunityId: string) {
    try {
        // 1. Fetch Opportunity and Approved Submissions
        const opportunity = await prisma.salesOpportunity.findUnique({
            where: { id: opportunityId },
            include: {
                company: true,
                items: true,
                salesOrders: {
                    select: { id: true }
                },
                sampleSubmissions: {
                    where: { status: 'CLIENT_APPROVED' },
                    include: {
                        sample: {
                            include: {
                                vendor: true,
                                project: true
                            }
                        }
                    },
                    orderBy: { updatedAt: 'desc' }
                }
            }
        });

        if (!opportunity) {
            return { success: false, error: "Opportunity not found" };
        }

        // 1.5 Validate Status and Existing Orders
        if (opportunity.status !== 'CLOSED_WON') {
            return { success: false, error: "Opportunity must be 'Closed Won' before creating an Order." };
        }

        if (opportunity.salesOrders && opportunity.salesOrders.length > 0) {
            return { success: false, error: "A Sales Order has already been created for this Opportunity." };
        }

        // 2. Validate Pre-requisites
        const approvedSubmission = opportunity.sampleSubmissions[0];
        if (!approvedSubmission) {
            return { success: false, error: "No Client Approved sample found to create order from." };
        }

        // 3. Calculate Amounts
        let totalAmount = 0;
        if (opportunity.items) {
            for (const item of opportunity.items) {
                // Only include items that have a matching approved sample
                const hasApprovedSample = opportunity.sampleSubmissions.some((sub: any) =>
                    sub.opportunityItemId === item.id ||
                    sub.sample?.project?.commodityId === item.commodityId || !item.commodityId
                );

                if (hasApprovedSample) {
                    const price = item.targetPrice?.toNumber() || 0;
                    const qty = item.quantity?.toNumber() || 0;
                    const qtyUnit = item.quantityUnit || 'MT';

                    if (item.priceType === 'TOTAL_AMOUNT') {
                        totalAmount += price;
                    } else if (item.priceType === 'PER_KG') {
                        const qtyInKG = qtyUnit === 'MT' ? (qty * 1000) : qty;
                        totalAmount += price * qtyInKG;
                    } else {
                        // PER_MT or default
                        const qtyInMT = qtyUnit === 'KG' ? (qty / 1000) : qty;
                        totalAmount += price * qtyInMT;
                    }
                }
            }
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
                status: 'PENDING',
                poUrl: opportunity.poUrl
            }
        });

        // 5. Close Opportunity (Already Closed Won)
        // await prisma.salesOpportunity.update({
        //     where: { id: opportunity.id },
        //     data: { status: 'CLOSED_WON' }
        // });

        // Log Activity
        await logActivity({
            action: "CREATE",
            entityType: "SalesOrder",
            entityId: salesOrder.id,
            entityTitle: `Order #${salesOrder.id.slice(0, 8).toUpperCase()}`,
            details: `Created sales order for ${opportunity.company.name} - ₹${totalAmount.toLocaleString()}`
        });

        // Send Confirmation Email
        await sendOrderConfirmationEmail(salesOrder.id);

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

export async function getSalesOrders(filters?: {
    page?: number;
    limit?: number;
    query?: string;
    status?: SalesOrderStatus | 'all';
    date?: string;
}) {
    try {
        const page = filters?.page || 1;
        const limit = filters?.limit || 10;
        const skip = (page - 1) * limit;

        const where: any = {};

        if (filters?.query) {
            const search = filters.query.trim();
            where.OR = [
                { id: { contains: search, mode: 'insensitive' } },
                {
                    client: {
                        name: { contains: search, mode: 'insensitive' }
                    }
                }
            ];
        }

        if (filters?.status && filters.status !== 'all') {
            where.status = filters.status;
        }

        if (filters?.date) {
            const date = new Date(filters.date);
            if (!isNaN(date.getTime())) {
                const startOfDay = new Date(date);
                startOfDay.setHours(0, 0, 0, 0);

                const endOfDay = new Date(date);
                endOfDay.setHours(23, 59, 59, 999);

                where.createdAt = {
                    gte: startOfDay,
                    lte: endOfDay
                };
            }
        }

        const [orders, total] = await prisma.$transaction([
            prisma.salesOrder.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    client: true,
                    opportunity: { include: { items: true } }
                }
            }),
            prisma.salesOrder.count({ where })
        ]);

        const safeOrders = orders.map(order => ({
            ...order,
            totalAmount: order.totalAmount.toNumber(),
            opportunity: {
                ...order.opportunity,
                items: order.opportunity.items?.map((it: any) => ({
                    ...it,
                    targetPrice: it.targetPrice?.toNumber(),
                    quantity: it.quantity?.toNumber(),
                    procurementQuantity: it.procurementQuantity ? it.procurementQuantity.toNumber() : undefined
                }))
            }
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
                invoices: {
                    include: {
                        items: {
                            include: {
                                opportunityItem: { include: { commodity: true, varietyForm: true } }
                            }
                        }
                    }
                },
                shipments: {
                    orderBy: { createdAt: 'desc' }
                },
                opportunity: {
                    include: {
                        items: {
                            include: {
                                varietyForm: true
                            }
                        },
                        procurementProject: {
                            include: {
                                purchaseOrders: {
                                    include: {
                                        items: true,
                                        vendor: true,
                                        sample: true,
                                        bills: true
                                    },
                                    orderBy: { createdAt: 'desc' }
                                }
                            }
                        },
                        sampleSubmissions: {
                            include: {
                                sample: {
                                    include: {
                                        vendor: true,
                                        project: true
                                    }
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
        const allSamples = order.opportunity.sampleSubmissions.map((sub: any) => ({
            ...sub.sample,
            priceQuoted: sub.sample.priceQuoted?.toNumber(),
            vendor: sub.sample.vendor,
            submissionStatus: sub.status, // Include status so we can show it
            opportunityItemId: sub.opportunityItemId
        }));

        const approvedSamples = allSamples.filter(s => s.submissionStatus === 'CLIENT_APPROVED');

        const safeOrder = {
            ...order,
            totalAmount: order.totalAmount.toNumber(),
            opportunity: {
                ...order.opportunity,
                items: order.opportunity.items?.map((it: any) => ({
                    ...it,
                    targetPrice: it.targetPrice?.toNumber(),
                    quantity: it.quantity?.toNumber(),
                    procurementQuantity: it.procurementQuantity ? it.procurementQuantity.toNumber() : undefined
                })),
                procurementProject: order.opportunity.procurementProject ? {
                    ...order.opportunity.procurementProject,
                    purchaseOrders: order.opportunity.procurementProject.purchaseOrders.map((po: any) => ({
                        ...po,
                        items: po.items?.map((it: any) => ({
                            ...it,
                            quantity: it.quantity?.toNumber() || 0,
                            rate: it.rate?.toNumber() || 0,
                            amount: it.amount?.toNumber() || 0
                        })) || [],
                        bills: po.bills?.map((b: any) => ({
                            ...b,
                            totalAmount: b.totalAmount?.toNumber() || 0,
                            pendingAmount: b.pendingAmount?.toNumber() || 0
                        })) || [],
                        totalAmount: po.totalAmount.toNumber(),
                        quantity: po.items?.reduce((sum: number, it: any) => sum + (it.quantity?.toNumber() || 0), 0) || 0,
                        sample: po.sample ? {
                            ...po.sample,
                            priceQuoted: po.sample.priceQuoted?.toNumber()
                        } : null
                    }))
                } : null,
                sampleSubmissions: order.opportunity.sampleSubmissions.map((sub: any) => ({
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
                items: po.items?.map((it: any) => ({
                    ...it,
                    quantity: it.quantity?.toNumber() || 0,
                    rate: it.rate?.toNumber() || 0,
                    amount: it.amount?.toNumber() || 0
                })) || [],
                bills: po.bills?.map((b: any) => ({
                    ...b,
                    totalAmount: b.totalAmount?.toNumber() || 0,
                    pendingAmount: b.pendingAmount?.toNumber() || 0
                })) || [],
                totalAmount: po.totalAmount.toNumber(),
                quantity: po.items?.reduce((sum: number, it: any) => sum + (it.quantity?.toNumber() || 0), 0) || 0,
                sample: po.sample ? {
                    ...po.sample,
                    priceQuoted: po.sample.priceQuoted?.toNumber()
                } : null
            })) || [],
            invoices: order.invoices.map(inv => ({
                ...inv,
                totalAmount: inv.totalAmount.toNumber(),
                pendingAmount: inv.pendingAmount.toNumber(),
                items: inv.items?.map((it: any) => ({
                    ...it,
                    quantity: it.quantity?.toNumber(),
                    rate: it.rate?.toNumber(),
                    amount: it.amount?.toNumber(),
                    // Pass down the nested product/commodity info for UI rendering
                    opportunityItem: it.opportunityItem ? {
                        ...it.opportunityItem,
                        targetPrice: it.opportunityItem.targetPrice?.toNumber() || 0,
                        quantity: it.opportunityItem.quantity?.toNumber() || 0,
                        procurementQuantity: it.opportunityItem.procurementQuantity?.toNumber() || 0
                    } : null
                })) || []
            })),
            shipments: order.shipments.map(s => ({
                ...s,
                quantity: s.quantity ? s.quantity.toNumber() : null
            }))
        };

        return { success: true, data: safeOrder };
    } catch (error: any) {
        console.error("Failed to fetch sales order:", error);
        return { success: false, error: "Failed to fetch order" };
    }
}

export async function updateSalesOrderStatus(id: string, status: SalesOrderStatus, notes?: string) {
    try {
        const session = await auth();

        // VALIDATION: Prevent manual move to SHIPPED without prerequisites
        if (status === 'SHIPPED') {
            const checkOrder = await prisma.salesOrder.findUnique({
                where: { id },
                include: { invoices: true, shipments: true }
            });

            if (!checkOrder) return { success: false, error: "Order not found" };

            if (checkOrder.invoices.length === 0) {
                return { success: false, error: "Cannot Mark Shipped: No Invoice generated." };
            }

            if (checkOrder.shipments.length === 0) {
                return { success: false, error: "Cannot Mark Shipped: No Shipment details added." };
            }

            // CHECK PAYMENT
            const totalPaid = checkOrder.invoices.reduce((sum, inv) => {
                return sum + (inv.totalAmount.toNumber() - inv.pendingAmount.toNumber());
            }, 0);

            if (totalPaid <= 0) {
                return { success: false, error: "Cannot Mark Shipped: No Payment recorded. At least partial payment is required." };
            }
        }

        // VALIDATION: CANCELLED (Safeguard Logic)
        if (status === 'CANCELLED') {
            const checkOrder = await prisma.salesOrder.findUnique({
                where: { id },
                include: { invoices: true, shipments: true }
            });

            if (!checkOrder) return { success: false, error: "Order not found" };

            const totalShipped = checkOrder.shipments.reduce((sum, s) => sum + (s.quantity?.toNumber() || 0), 0);
            const totalPaid = checkOrder.invoices.reduce((sum, inv) => {
                return sum + (inv.totalAmount.toNumber() - inv.pendingAmount.toNumber());
            }, 0);

            // If active processing happened (money taken or goods sent), require explanation
            if ((totalShipped > 0 || totalPaid > 0) && !notes) {
                return {
                    success: false,
                    error: `Strict Validation Failed: Order has partial fulfillment (Shipped: ${totalShipped}, Paid: ${totalPaid}). Please provide cancel remarks/reason.`
                };
            }
        }

        // VALIDATION: DELIVERED or COMPLETED (Strict Check)
        if (status === 'DELIVERED' || status === 'COMPLETED') {
            const checkOrder = await prisma.salesOrder.findUnique({
                where: { id },
                include: { invoices: true, shipments: true, opportunity: { include: { items: true } } }
            });

            if (!checkOrder) return { success: false, error: "Order not found" };

            // RULE: "User can not Jump from Inprogress to Delivered status directly skipping shipped Status"
            // Allow COMPLETED from DELIVERED.
            if (status === 'DELIVERED' && checkOrder.status !== 'SHIPPED') {
                return { success: false, error: "Invalid Transition: Order must be in SHIPPED status before it can be marked as DELIVERED." };
            }

            // 1. Quantity Check
            const totalShipped = checkOrder.shipments.reduce((sum: any, s: any) => sum + (s.quantity?.toNumber() || 0), 0);
            const orderQty = checkOrder.opportunity.items?.reduce((sum: any, it: any) => sum + (it.quantity?.toNumber() || 0), 0) || 0;
            const isFullQty = Math.abs(totalShipped - orderQty) < 0.01;

            // 2. Payment Check
            const totalPaid = checkOrder.invoices.reduce((sum, inv) => {
                return sum + (inv.totalAmount.toNumber() - inv.pendingAmount.toNumber());
            }, 0);
            const totalAmount = checkOrder.totalAmount.toNumber();
            const isFullPaid = Math.abs(totalPaid - totalAmount) < 1.00; // 1 rupee tolerance

            // 3. Shipment Status Check (STRICT BLOCKING)
            const hasUndeliveredShipments = checkOrder.shipments.some(s => s.status !== 'DELIVERED');
            if (hasUndeliveredShipments) {
                return { success: false, error: "Strict Validation Failed: All Shipments must be marked as DELIVERED before completing the Order." };
            }

            // If mismatch AND no notes -> Reject
            if ((!isFullQty || !isFullPaid) && !notes) {
                return {
                    success: false,
                    error: `Strict Validation Failed: ${!isFullQty ? `Qty Pending (${totalShipped}/${orderQty})` : ''} ${!isFullPaid ? `Payment Pending (${totalPaid}/${totalAmount})` : ''}. Please provide closure notes to proceed.`
                };
            }
        }

        const order = await prisma.salesOrder.update({
            where: { id },
            data: {
                status,
                fulfillmentNotes: notes, // Save notes if provided
                updatedById: session?.user?.id
            },
            include: {
                opportunity: {
                    include: {
                        company: true,
                        items: true,
                        procurementProject: true, // Check if exists
                        sampleSubmissions: {
                            where: { status: 'CLIENT_APPROVED' },
                            include: {
                                sample: { include: { vendor: true } }
                            }
                        }
                    }
                }
            }
        });

        await logActivity({
            action: "STATUS_CHANGE",
            entityType: "SalesOrder",
            entityId: order.id,
            entityTitle: `Order #${order.id.slice(0, 8).toUpperCase()}`,
            details: `Changed status to ${status}`
        });

        // Trigger Procurement Creation if IN_PROGRESS and Project doesn't exist (or isn't a Fulfillment project)
        const currentProject = order.opportunity.procurementProject;
        const hasFulfillmentProject = currentProject && currentProject.name.startsWith("Fulfillment:");

        if (status === 'IN_PROGRESS' && !hasFulfillmentProject) {
            const approvedSubmission = order.opportunity.sampleSubmissions[0];
            if (approvedSubmission) {
                const sample = approvedSubmission.sample;
                const orderQty = order.opportunity.items?.reduce((sum: any, it: any) => sum + (it.quantity?.toNumber() || 0), 0) || 0;

                const hasMultipleItems = order.opportunity.items && order.opportunity.items.length > 1;
                const firstItem = order.opportunity.items?.[0];

                let projectName = `Fulfillment: Order #${order.id.slice(0, 8)} - ${order.opportunity.company.name}`;
                if (!hasMultipleItems && firstItem?.productName) {
                    projectName = `Fulfillment: ${firstItem.productName} - ${order.opportunity.company.name}`;
                }

                // Create Project
                const project = await prisma.procurementProject.create({
                    data: {
                        name: projectName,
                        status: 'SOURCING',
                        commodityId: hasMultipleItems ? null : (firstItem?.commodityId || null),
                        varietyId: hasMultipleItems ? null : (firstItem?.varietyId || null),
                        createdById: session?.user?.id,
                        updatedById: session?.user?.id
                    }
                });

                await logActivity({
                    action: "CREATE",
                    entityType: "ProcurementProject",
                    entityId: project.id,
                    details: `Auto-created fulfillment project for Order #${order.id.slice(0, 8)}`
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

                    // PO Creation is now manual as per user request
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
                    items: order.opportunity.items?.map((it: any) => ({
                        ...it,
                        targetPrice: it.targetPrice?.toNumber(),
                        quantity: it.quantity?.toNumber(),
                        procurementQuantity: it.procurementQuantity ? it.procurementQuantity.toNumber() : undefined
                    })),
                    procurementProject: order.opportunity.procurementProject ? {
                        ...order.opportunity.procurementProject,
                    } : null,
                    sampleSubmissions: order.opportunity.sampleSubmissions.map((sub: any) => ({
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
