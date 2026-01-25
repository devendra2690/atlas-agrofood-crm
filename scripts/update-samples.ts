
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    try {
        // Reset CLIENT_APPROVED
        const r1 = await prisma.sampleRecord.updateMany({
            where: { status: "CLIENT_APPROVED" },
            data: { status: "Result_APPROVED_INTERNAL" }
        });
        console.log(`Reset ${r1.count} CLIENT_APPROVED samples.`);

        // Reset CLIENT_REJECTED
        const r2 = await prisma.sampleRecord.updateMany({
            where: { status: "CLIENT_REJECTED" },
            data: { status: "Result_APPROVED_INTERNAL" } // Assuming we restart cycle or just Approved? 
            // If it was client rejected, it was approved internally first. So resetting to Approved Internal is correct.
        });
        console.log(`Reset ${r2.count} CLIENT_REJECTED samples.`);

        // Reset SENT_TO_CLIENT
        const r3 = await prisma.sampleRecord.updateMany({
            where: { status: "SENT_TO_CLIENT" },
            data: { status: "Result_APPROVED_INTERNAL" }
        });
        console.log(`Reset ${r3.count} SENT_TO_CLIENT samples.`);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
