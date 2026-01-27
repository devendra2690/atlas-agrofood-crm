
import { prisma } from "../src/lib/prisma";

async function main() {
    // 1. Find the Opportunity
    const opportunity = await prisma.salesOpportunity.findFirst({
        where: { company: { name: "Test Client Alpha" } },
        orderBy: { createdAt: 'desc' }
    });

    if (!opportunity) {
        console.error("Opportunity not found! Make sure 'Test Client Alpha' and their opportunity exist.");
        process.exit(1);
    }
    console.log("Found Opportunity:", opportunity.id);

    // 2. Create Vendor
    let vendor = await prisma.company.findFirst({
        where: { name: "Test Vendor Beta", type: "VENDOR" }
    });

    if (!vendor) {
        vendor = await prisma.company.create({
            data: {
                name: "Test Vendor Beta",
                type: "VENDOR",
                email: "vendor@beta.com",
                phone: "123",
                trustLevel: "UNRATED",
                status: "ACTIVE"
            }
        });
        console.log("Created Vendor:", vendor.id);
    } else {
        console.log("Found Vendor:", vendor.id);
    }

    // 3. Create Procurement Project (Mock Sourcing)
    const project = await prisma.procurementProject.create({
        data: {
            name: `Sourcing for ${opportunity.productName}`,
            status: "SOURCING",
            commodityId: opportunity.commodityId
        }
    });
    console.log("Created Project:", project.id);

    // 4. Create Sample Record
    // Note: status 'RECEIVED' is required for internal review, but for submission we just need the record.
    const sample = await prisma.sampleRecord.create({
        data: {
            projectId: project.id,
            vendorId: vendor.id,
            status: "RECEIVED",
            receivedDate: new Date(),
            priceQuoted: 45,
            priceUnit: "PER_KG"
        }
    });
    console.log("Created Sample:", sample.id);

    // 5. Link to Opportunity (Submission)
    // Create logic requires status 'CLIENT_APPROVED'
    const submission = await prisma.sampleSubmission.create({
        data: {
            sampleId: sample.id,
            opportunityId: opportunity.id,
            status: "CLIENT_APPROVED"
        }
    });
    console.log("Created & Approved Submission:", submission.id);
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
