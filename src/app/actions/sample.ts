"use server";

import { prisma } from "@/lib/prisma";
import { SampleStatus, OpportunityPriceType, TrustLevel } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

// ... (keep createSampleRequest and getProjectSamples as is or update if needed but they might not need changes yet)

// ...

export type UpdateSampleData = {
    priceQuoted?: number;
    priceUnit?: OpportunityPriceType;
    images?: string[];
    qualityNotes?: string;
    feedback?: string;
    notes?: string;
    status?: SampleStatus;
};

export async function updateSampleDetails(id: string, data: UpdateSampleData) {
    try {
        const session = await auth();
        const sample = await prisma.sampleRecord.update({
            where: { id },
            data: {
                updatedById: session?.user?.id,
                priceQuoted: data.priceQuoted,
                priceUnit: data.priceUnit,
                images: data.images,
                qualityNotes: data.qualityNotes,
                feedback: data.feedback,
                notes: data.notes,
                status: data.status
            }
        });

        revalidatePath("/procurement");

        return {
            success: true,
            data: {
                ...sample,
                priceQuoted: sample.priceQuoted?.toNumber()
            }
        };
    } catch (error: any) {
        console.error("Failed to update sample details:", error);
        return { success: false, error: `Error: ${error.message}` };
    }
}

export async function createSampleRequest(projectId: string, vendorId: string, notes?: string) {
    try {
        const session = await auth();
        const sample = await prisma.sampleRecord.create({
            data: {
                createdById: session?.user?.id,
                updatedById: session?.user?.id,
                projectId,
                vendorId,
                notes,
                status: "REQUESTED",
                // receivedDate is nullable now, so we don't set it yet
            }
        });

        revalidatePath(`/procurement/${projectId}`);
        return { success: true, data: sample };
    } catch (error: any) {
        console.error("Failed to create sample request:", error);
        return { success: false, error: `Error: ${error.message}` };
    }
}

export async function getProjectSamples(projectId: string) {
    try {
        const samples = await prisma.sampleRecord.findMany({
            where: { projectId },
            include: {
                vendor: true
            },
            orderBy: { receivedDate: 'desc' } // or createdAt if we had it, but ID sort of works or nulls last? 
            // We don't have createdAt on SampleRecord based on schema view, let's check schema again. 
            // Schema didn't show createdAt. We might want to add it for sorting? 
            // For now let's sort by id or just return as is.
        });
        return { success: true, data: samples };
    } catch (error) {
        console.error("Failed to get project samples:", error);
        return { success: false, error: "Failed to fetch samples" };
    }
}

export async function updateSampleStatus(id: string, status: SampleStatus) {
    try {
        const data: any = { status };

        // If marking as RECEIVED, set the date
        if (status === "RECEIVED") {
            data.receivedDate = new Date();
        }

        const session = await auth();
        const sample = await prisma.sampleRecord.update({
            where: { id },
            data: {
                ...data,
                updatedById: session?.user?.id
            }
        });

        revalidatePath("/procurement");
        revalidatePath("/opportunities"); // Also refresh opportunities view
        return {
            success: true,
            data: {
                ...sample,
                priceQuoted: sample.priceQuoted?.toNumber()
            }
        };
    } catch (error) {
        console.error("Failed to update sample status:", error);
        return { success: false, error: "Failed to update status" };
    }
}



export async function getAllSamples(filters?: {
    location?: string;
    commodityId?: string;
    trustLevel?: string; // TrustLevel enum as string
    page?: number;
    limit?: number;
}) {
    try {
        const where: any = {};
        const page = filters?.page || 1;
        const limit = filters?.limit || 10;
        const skip = (page - 1) * limit;

        if (filters?.location) {
            where.vendor = {
                OR: [
                    { city: { name: { contains: filters.location, mode: 'insensitive' } } },
                    { state: { name: { contains: filters.location, mode: 'insensitive' } } },
                    { country: { name: { contains: filters.location, mode: 'insensitive' } } }
                ]
            };
        }

        if (filters?.commodityId && filters.commodityId !== 'all') {
            where.project = {
                commodityId: filters.commodityId
            };
        }

        if (filters?.trustLevel && filters.trustLevel !== 'all') {
            if (!where.vendor) where.vendor = {};
            where.vendor.trustLevel = filters.trustLevel as TrustLevel;
        }

        const [samples, total] = await prisma.$transaction([
            prisma.sampleRecord.findMany({
                where,
                orderBy: { id: 'desc' },
                skip,
                take: limit,
                include: {
                    vendor: {
                        include: {
                            city: true,
                            state: true,
                            country: true
                        }
                    },
                    project: {
                        include: {
                            commodity: true
                        }
                    }
                }
            }),
            prisma.sampleRecord.count({ where })
        ]);

        const safeSamples = samples.map(sample => ({
            ...sample,
            priceQuoted: sample.priceQuoted?.toNumber()
        }));

        return {
            success: true,
            data: safeSamples,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    } catch (error: any) {
        console.error("Failed to get all samples:", error);
        return { success: false, error: "Failed to fetch samples" };
    }
}

export async function linkSampleToOpportunity(sampleId: string, opportunityId: string) {
    try {
        const submission = await prisma.sampleSubmission.create({
            data: {
                sampleId,
                opportunityId,
                status: "SENT_TO_CLIENT"
            }
        });
        revalidatePath("/opportunities");
        revalidatePath("/procurement");
        return { success: true, data: submission };
    } catch (error: any) {
        console.error("Failed to link sample:", error);
        if (error.code === 'P2002') {
            return { success: false, error: "This sample is already linked to this opportunity." };
        }
        return { success: false, error: `Failed to link sample: ${error.message}` };
    }
}

export async function updateSubmissionStatus(id: string, status: SampleStatus) {
    try {
        const submission = await prisma.sampleSubmission.update({
            where: { id },
            data: { status }
        });
        revalidatePath("/opportunities");
        revalidatePath("/procurement");
        return { success: true, data: submission };
    } catch (error) {
        console.error("Failed to update submission status:", error);
        return { success: false, error: "Failed to update status" };
    }
}


export async function sendSampleToClient(sampleId: string, opportunityId: string) {
    return linkSampleToOpportunity(sampleId, opportunityId);
}
