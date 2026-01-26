'use server'

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { OpportunityStatus, TrustLevel } from "@prisma/client";
import { auth } from "@/auth";

export type OpportunityFormData = {
    companyId: string;
    productName: string;
    commodityId?: string; // NEW
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
async function calculateProcurementQuantity(commodityId?: string, quantity?: number, manualProcurementQty?: number): Promise<number | undefined> {
    if (manualProcurementQty) return manualProcurementQty;
    if (!commodityId || !quantity) return undefined;

    const commodity = await prisma.commodity.findUnique({
        where: { id: commodityId },
        select: { yieldPercentage: true }
    });

    if (!commodity || !commodity.yieldPercentage) return quantity; // Default to same quantity if no yield info

    // Formula: Needed = Quantity * (100 / Yield%)
    // E.g. 25% yield: 100/25 = 4 needed per 1 unit.
    const multiplier = 100 / commodity.yieldPercentage;
    return quantity * multiplier;
}

export async function createOpportunity(data: OpportunityFormData) {
    try {
        const procurementQuantity = await calculateProcurementQuantity(
            data.commodityId,
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

        revalidatePath(`/companies/${data.companyId}`);
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
}) {
    try {
        const where: any = {};
        const page = filters?.page || 1;
        const limit = filters?.limit || 10;
        const skip = (page - 1) * limit;

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
                    commodity: true, // NEW
                    createdBy: { select: { name: true } },
                    updatedBy: { select: { name: true } },
                    sampleSubmissions: {
                        include: {
                            sample: {
                                include: {
                                    vendor: true
                                }
                            }
                        },
                        orderBy: {
                            createdAt: 'desc'
                        }
                    },
                    procurementProject: {
                        include: {
                            samples: {
                                include: {
                                    vendor: true
                                },
                                orderBy: {
                                    receivedDate: 'desc'
                                }
                            }
                        }
                    }
                },
            }),
            prisma.salesOpportunity.count({ where })
        ]);

        // Sanitize Decimal types
        const safeOpportunities = opportunities.map(opp => ({
            ...opp,
            targetPrice: opp.targetPrice?.toNumber(),
            quantity: opp.quantity?.toNumber(),
            procurementQuantity: opp.procurementQuantity?.toNumber(), // Fix: Serialize Decimal
            sampleSubmissions: (opp.sampleSubmissions || []).map(sub => ({
                ...sub,
                sample: {
                    ...sub.sample,
                    priceQuoted: sub.sample.priceQuoted?.toNumber()
                }
            })),
            procurementProject: opp.procurementProject ? {
                ...opp.procurementProject,
                samples: (opp.procurementProject.samples || []).map(s => ({
                    ...s,
                    priceQuoted: s.priceQuoted?.toNumber()
                }))
            } : null
        }));

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
        console.error("Failed to get opportunities DEBUG:", error);
        return { success: false, error: "Failed to fetch opportunities" };
    }
}
