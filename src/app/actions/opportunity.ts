'use server'

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { OpportunityStatus } from "@prisma/client";
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
        const opportunity = await prisma.salesOpportunity.create({
            data: {
                createdById: session?.user?.id,
                updatedById: session?.user?.id,
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
        const opportunity = await prisma.salesOpportunity.update({
            where: { id },
            data: {
                updatedById: session?.user?.id,
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

export async function getOpportunities() {
    try {
        const opportunities = await prisma.salesOpportunity.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                company: true,
                commodity: true, // NEW
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
        });

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

        return { success: true, data: safeOpportunities };
    } catch (error) {
        console.error("Failed to get opportunities DEBUG:", error);
        return { success: false, error: "Failed to fetch opportunities" };
    }
}
