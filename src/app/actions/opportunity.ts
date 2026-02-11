'use server'

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { OpportunityStatus, TrustLevel } from "@prisma/client";
import { auth } from "@/auth";
import { logActivity } from "./audit";

export type OpportunityFormData = {
    companyId: string;
    productName: string;
    commodityId?: string;
    varietyId?: string; // NEW
    targetPrice?: number;
    priceType?: "PER_KG" | "PER_MT" | "TOTAL_AMOUNT";
    quantity?: number;
    deadline?: Date;
    status?: OpportunityStatus;
    type?: "ONE_TIME" | "RECURRING";
    recurringFrequency?: "WEEKLY" | "MONTHLY";
    notes?: string;
    procurementQuantity?: number; // Manual override
};

// Helper: Calculate procurement quantity
async function calculateProcurementQuantity(commodityId?: string, varietyId?: string, quantity?: number, manualProcurementQty?: number): Promise<number | undefined> {
    if (manualProcurementQty) return manualProcurementQty;
    if (!commodityId || !quantity) return undefined;

    let yieldPercentage = 100;

    if (varietyId) {
        const variety = await prisma.commodityVariety.findUnique({
            where: { id: varietyId },
            select: { yieldPercentage: true }
        });
        if (variety?.yieldPercentage) {
            yieldPercentage = variety.yieldPercentage;
        }
    } else {
        const commodity = await prisma.commodity.findUnique({
            where: { id: commodityId },
            select: { yieldPercentage: true }
        });
        if (commodity?.yieldPercentage) {
            yieldPercentage = commodity.yieldPercentage;
        }
    }

    // Formula: Needed = Quantity * (100 / Yield%)
    const multiplier = 100 / yieldPercentage;
    return quantity * multiplier;
}

export async function createOpportunity(data: OpportunityFormData) {
    try {
        const procurementQuantity = await calculateProcurementQuantity(
            data.commodityId,
            data.varietyId,
            data.quantity,
            data.procurementQuantity
        );

        const session = await auth();
        let userId = session?.user?.id;

        // Verify user exists
        if (userId) {
            const userExists = await prisma.user.findUnique({ where: { id: userId } });
            if (!userExists) {
                console.log("DEBUG: Session user not found in DB, falling back to admin.");
                userId = undefined;
            }
        }

        // Fallback to first admin if no valid user
        if (!userId) {
            const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
            userId = admin?.id;
        }

        const opportunity = await prisma.salesOpportunity.create({
            data: {
                createdById: userId,
                updatedById: userId,
                companyId: data.companyId,
                productName: data.productName,
                commodityId: data.commodityId,
                varietyId: data.varietyId,
                targetPrice: data.targetPrice,
                priceType: data.priceType || "PER_KG",
                quantity: data.quantity,
                procurementQuantity: procurementQuantity,
                deadline: data.deadline,
                status: data.status || "OPEN",
                type: data.type || "ONE_TIME",
                recurringFrequency: data.recurringFrequency,
                notes: data.notes,
            },
        });

        // Sanitize Decimal types
        const safeOpportunity = {
            ...opportunity,
            targetPrice: opportunity.targetPrice?.toNumber(),
            quantity: opportunity.quantity?.toNumber(),
            procurementQuantity: opportunity.procurementQuantity?.toNumber(),
        };

        await logActivity({
            action: "CREATE",
            entityType: "Opportunity",
            entityId: opportunity.id,
            entityTitle: opportunity.productName,
            details: `Created opportunity for ${data.productName} - ${data.quantity} units`
        });

        revalidatePath(`/companies/${data.companyId}`);
        revalidatePath("/opportunities");
        return { success: true, data: safeOpportunity };
    } catch (error: any) {
        console.error("Failed to create opportunity:", error);
        return { success: false, error: error.message || "Failed to create opportunity" };
    }
}

export async function updateOpportunity(id: string, data: OpportunityFormData) {
    try {
        const procurementQuantity = await calculateProcurementQuantity(
            data.commodityId,
            data.varietyId,
            data.quantity,
            data.procurementQuantity
        );

        const session = await auth();
        let userId = session?.user?.id;

        // Verify user exists
        if (userId) {
            const userExists = await prisma.user.findUnique({ where: { id: userId } });
            if (!userExists) {
                userId = undefined;
            }
        }

        if (!userId) {
            const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
            userId = admin?.id;
        }

        const opportunity = await prisma.salesOpportunity.update({
            where: { id },
            data: {
                updatedById: userId,
                companyId: data.companyId,
                productName: data.productName,
                commodityId: data.commodityId,
                varietyId: data.varietyId,
                targetPrice: data.targetPrice,
                priceType: data.priceType || "PER_KG",
                quantity: data.quantity,
                procurementQuantity: procurementQuantity,
                deadline: data.deadline,
                status: data.status || "OPEN",
                type: data.type || "ONE_TIME",
                recurringFrequency: data.recurringFrequency,
                notes: data.notes,
            },
        });

        // Sanitize Decimal types
        const safeOpportunity = {
            ...opportunity,
            targetPrice: opportunity.targetPrice?.toNumber(),
            quantity: opportunity.quantity?.toNumber(),
            procurementQuantity: opportunity.procurementQuantity?.toNumber(),
        };

        await logActivity({
            action: "UPDATE",
            entityType: "Opportunity",
            entityId: id,
            details: `Updated opportunity: ${data.productName}`
        });

        revalidatePath("/opportunities");
        revalidatePath(`/companies/${data.companyId}`);
        return { success: true, data: safeOpportunity };
    } catch (error: any) {
        console.error("Failed to update opportunity:", error);
        return { success: false, error: error.message || "Failed to update opportunity" };
    }
}

export async function deleteOpportunity(id: string) {
    try {
        await prisma.salesOpportunity.delete({
            where: { id },
        });

        await logActivity({
            action: "DELETE",
            entityType: "Opportunity",
            entityId: id,
            details: "Deleted opportunity"
        });

        revalidatePath("/opportunities");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete opportunity:", error);
        return { success: false, error: "Failed to delete opportunity" };
    }
}

export async function getOpportunities(filters?: {
    location?: string;
    commodityId?: string;
    trustLevel?: string;
    page?: number;
    limit?: number;
    query?: string;
    status?: string;
    date?: string;
    priorityId?: string;
}) {
    try {
        const where: any = {};
        const page = filters?.page || 1;
        const limit = filters?.limit || 10;
        const skip = (page - 1) * limit;

        // If priorityId is provided, we want to ensure it's included or handled.
        // Option 1: If priorityId exists, we can ignore pagination for that item or fetch it separately.
        // Let's fetch it separately if it doesn't appear in the main query to ensure it's visible.

        if (filters?.query) {
            const search = filters.query.trim();
            where.OR = [
                { productName: { contains: search, mode: 'insensitive' } },
                {
                    company: {
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

        if (filters?.commodityId && filters.commodityId !== 'all') {
            where.commodityId = filters.commodityId;
        }

        if (filters?.location) {
            // If query is also present, we need to be careful not to overwrite the OR.
            // But usually location filter is specific. Let's use AND for location if query exists.
            const locationFilter = {
                OR: [
                    { city: { name: { contains: filters.location, mode: 'insensitive' } } },
                    { state: { name: { contains: filters.location, mode: 'insensitive' } } },
                    { country: { name: { contains: filters.location, mode: 'insensitive' } } }
                ]
            };

            if (where.company) {
                // If company filter exists (e.g. from OR above... wait, OR is top level)
                // This is getting tricky with Prisma OR logic if we mix them.
                // Simpler approach: Apply location filter to company relation inside the AND structure if possible
                // OR just separate them.

                // Let's attach to where.company if it exists or create it.
                // Actually, the structure where.company = { OR: [...] } matches the previous code.
                // If we have query search on company name, we might have a conflict if we blindly assign.
                // Let's merge them properly.

                where.company = {
                    ...(where.company || {}),
                    ...locationFilter
                };
            } else {
                where.company = locationFilter;
            }
        }

        if (filters?.trustLevel && filters.trustLevel !== 'all') {
            if (!where.company) where.company = {};
            where.company.trustLevel = filters.trustLevel as TrustLevel;
        }

        const [opportunities, total] = await prisma.$transaction([
            prisma.salesOpportunity.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    company: true,
                    commodity: true,
                    variety: true, // NEW
                    createdBy: { select: { name: true } },
                    updatedBy: { select: { name: true } },
                    sampleSubmissions: {
                        select: {
                            id: true,
                            status: true,
                            sample: {
                                select: {
                                    id: true,
                                    priceQuoted: true,
                                    vendor: { select: { name: true } }
                                }
                            }
                        },
                        orderBy: { createdAt: 'desc' }
                    },
                    procurementProject: {
                        select: {
                            id: true,
                            status: true,
                            // Only fetch count or minimal info if possible, avoiding deep sample list
                            samples: {
                                select: {
                                    id: true,
                                    status: true
                                }
                            }
                        }
                    }
                },
            }),
            prisma.salesOpportunity.count({ where })
        ]);

        let finalOpportunities = opportunities;

        // If we have a priorityId, ensure it's in the list
        if (filters?.priorityId) {
            console.log(`DEBUG: Checking priorityId ${filters.priorityId} on page ${page}`);
            const isIncluded = opportunities.some(o => o.id === filters.priorityId);
            console.log(`DEBUG: isIncluded? ${isIncluded}`);

            if (!isIncluded) {
                console.log(`DEBUG: Fetching priority opportunity separately`);
                const priorityOpp = await prisma.salesOpportunity.findUnique({
                    where: { id: filters.priorityId },
                    include: {
                        company: true,
                        commodity: true,
                        variety: true, // NEW
                        createdBy: { select: { name: true } },
                        updatedBy: { select: { name: true } },
                        sampleSubmissions: {
                            include: { sample: { include: { vendor: true } } },
                            orderBy: { createdAt: 'desc' }
                        },
                        procurementProject: {
                            include: { samples: { include: { vendor: true }, orderBy: { receivedDate: 'desc' } } }
                        }
                    }
                });

                if (priorityOpp) {
                    console.log(`DEBUG: Found priority opp, prepending`);
                    finalOpportunities = [priorityOpp, ...opportunities];
                } else {
                    console.log(`DEBUG: Priority opp not found in DB`);
                }
            }
        }

        const safeOpportunities = finalOpportunities.map(sanitizeOpportunity);

        return {
            success: true,
            data: safeOpportunities,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    } catch (error) {
        console.error("Failed to get opportunities:", error);
        return { success: false, error: "Failed to fetch opportunities" };
    }
}

// Helper to ensure all Decimal types are converted to numbers for client components
function sanitizeOpportunity(opp: any) {
    if (!opp) return null;
    return {
        ...opp,
        targetPrice: opp.targetPrice && typeof opp.targetPrice.toNumber === 'function' ? opp.targetPrice.toNumber() : opp.targetPrice,
        quantity: opp.quantity && typeof opp.quantity.toNumber === 'function' ? opp.quantity.toNumber() : opp.quantity,
        procurementQuantity: opp.procurementQuantity && typeof opp.procurementQuantity.toNumber === 'function' ? opp.procurementQuantity.toNumber() : opp.procurementQuantity,
        sampleSubmissions: opp.sampleSubmissions?.map((sub: any) => ({
            ...sub,
            sample: {
                ...sub.sample,
                priceQuoted: sub.sample?.priceQuoted && typeof sub.sample.priceQuoted.toNumber === 'function' ? sub.sample.priceQuoted.toNumber() : sub.sample?.priceQuoted
            }
        })),
        procurementProject: opp.procurementProject ? {
            ...opp.procurementProject,
            samples: opp.procurementProject.samples?.map((s: any) => ({
                ...s,
                priceQuoted: s.priceQuoted && typeof s.priceQuoted.toNumber === 'function' ? s.priceQuoted.toNumber() : s.priceQuoted
            }))
        } : null
    };
}

export async function updateOpportunityStatus(id: string, status: OpportunityStatus) {
    try {
        console.log(`DEBUG: updateOpportunityStatus called for ID: ${id} with Status: ${status}`);
        const session = await auth();
        // @ts-ignore
        if (!session?.user) {
            return { success: false, error: "Unauthorized" };
        }

        // Validate user exists in DB to prevent foreign key errors
        let userId = session.user.id;
        const userExists = await prisma.user.findUnique({ where: { id: userId } });

        if (!userExists) {
            console.warn(`DEBUG: User ${userId} not found in DB. Attempting fallback.`);
            // Fallback to first admin or any user
            const fallbackUser = await prisma.user.findFirst();
            if (fallbackUser) {
                userId = fallbackUser.id;
            } else {
                return { success: false, error: "System Error: No valid user found in database to perform this action." };
            }
        }

        // Fetch current opportunity data to check validations
        const currentOpp = await prisma.salesOpportunity.findUnique({
            where: { id },
            include: {
                sampleSubmissions: true
            }
        });

        if (!currentOpp) {
            return { success: false, error: "Opportunity not found" };
        }

        // VALIDATION: Negotiation requires at least one attached sample
        if (status === 'NEGOTIATION') {
            if (!currentOpp.sampleSubmissions || currentOpp.sampleSubmissions.length === 0) {
                return { success: false, error: "Cannot move to Negotiation: At least one sample must be attached." };
            }
        }

        // VALIDATION: Closed Won requires at least one Client Approved sample
        if (status === 'CLOSED_WON') {
            const hasApprovedSample = currentOpp.sampleSubmissions.some(s => s.status === 'CLIENT_APPROVED');
            if (!hasApprovedSample) {
                return { success: false, error: "Cannot Close Won: Must have at least one Client Approved sample." };
            }
        }

        const opportunity = await prisma.salesOpportunity.update({
            where: { id },
            data: {
                status,
                updatedById: userId
            }
        });

        // Create activity log
        await logActivity({
            action: "STATUS_CHANGE",
            entityType: "Opportunity",
            entityId: opportunity.id,
            details: `Updated opportunity ${opportunity.productName} status to ${status}`
        });

        revalidatePath("/opportunities");
        return { success: true, data: sanitizeOpportunity(opportunity) };
    } catch (error: any) {
        console.error("Failed to update status:", error);
        return { success: false, error: error.message || "Failed to update status" };
    }
}
