'use server'

import { prisma } from "@/lib/prisma";
import { logActivity } from "./audit";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function createPartnerSample(data: {
    opportunityId: string;
    vendorId: string;
    date: Date;
    quantity?: number;
    price?: number;
    notes?: string;
}) {
    try {
        const session = await auth();

        // 1. Check Opportunity and Existing Project
        const opportunity = await prisma.salesOpportunity.findUnique({
            where: { id: data.opportunityId },
            include: { procurementProject: true }
        });

        if (!opportunity) {
            return { success: false, error: "Opportunity not found" };
        }

        let projectId = opportunity.procurementProjectId;

        // 2. Create Project if missing
        if (!projectId) {
            const project = await prisma.procurementProject.create({
                data: {
                    name: `Sourcing for ${opportunity.productName}`,
                    type: "SAMPLE", // Or PROJECT, but this implies ad-hoc
                    status: "SOURCING",
                    createdById: session?.user?.id,
                    updatedById: session?.user?.id,
                    // Link to Commodity if opp has one
                    commodityId: opportunity.commodityId
                }
            });
            projectId = project.id;

            // Link Opp to Project
            await prisma.salesOpportunity.update({
                where: { id: opportunity.id },
                data: { procurementProjectId: projectId }
            });
        }

        // 3. Ensure Vendor Linked to Project
        const existingLink = await prisma.projectVendor.findUnique({
            where: {
                projectId_vendorId: {
                    projectId: projectId!,
                    vendorId: data.vendorId
                }
            }
        });

        if (!existingLink) {
            await prisma.projectVendor.create({
                data: {
                    projectId: projectId!,
                    vendorId: data.vendorId
                }
            });
        }

        // 4. Create Sample Record (Status: RECEIVED)
        const sample = await prisma.sampleRecord.create({
            data: {
                projectId: projectId!,
                vendorId: data.vendorId,
                status: "RECEIVED", // We collected it
                receivedDate: data.date,
                priceQuoted: data.price,
                notes: data.notes,
                createdById: session?.user?.id,
                updatedById: session?.user?.id,
            }
        });

        // 5. Create Sample Submission (Link to Opportunity)
        await prisma.sampleSubmission.create({
            data: {
                sampleId: sample.id,
                opportunityId: opportunity.id,
                status: "SENT_TO_CLIENT" // Ready to send, or just linked? Let's say SENT_TO_CLIENT as per flow usually implies we have it. Or maybe just "RECEIVED" status on sample is enough?
                // The prompt says "send it to client". 
                // Let's create the submission entry so it shows up in the "Samples" list on the Opportunity.
            }
        });

        await logActivity({
            action: "CREATE",
            entityType: "Sample",
            entityId: sample.id,
            details: `Collected partner sample for ${opportunity.productName}`
        });

        revalidatePath(`/opportunities/${opportunity.id}`);

        return { success: true, data: sample };

    } catch (error: any) {
        console.error("Failed to create partner sample:", error);
        return { success: false, error: error.message };
    }
}
