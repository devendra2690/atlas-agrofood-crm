import { PrismaClient } from "@prisma/client";

// Used to import getAllSamples but removed to avoid Next.js context issues in standalone script.

// Better to just use Prisma directly to simulate what the action does.

const prisma = new PrismaClient();

async function verify() {
    console.log("Verifying data...");
    const total = await prisma.sampleRecord.count();
    console.log("Total Samples:", total);

    const locations = await prisma.sampleRecord.findMany({
        include: { vendor: { include: { city: true } } },
        take: 5
    });
    console.log("Sample Locations (first 5):", locations.map(s => s.vendor.city?.name));

    // Test Filtering Logic Simulation
    console.log("\nTesting Filter Logic (Prisma level):");

    // Filter by Location "Mumbai"
    const mumbaiSamples = await prisma.sampleRecord.findMany({
        where: {
            vendor: {
                OR: [
                    { city: { name: { contains: "Mumbai", mode: 'insensitive' } } },
                    { state: { name: { contains: "Mumbai", mode: 'insensitive' } } }
                ]
            }
        }
    });
    console.log(`Samples in Mumbai: ${mumbaiSamples.length}`);

    // Filter by Status
    const approvedSamples = await prisma.sampleRecord.findMany({
        where: { status: "Result_APPROVED_INTERNAL" }
    });
    console.log(`Approved Internal Samples: ${approvedSamples.length}`);

    // Pagination Limit 10
    const page1 = await prisma.sampleRecord.findMany({
        take: 10,
        orderBy: { id: 'desc' }
    });
    console.log(`Page 1 count: ${page1.length}`);
}

verify()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
