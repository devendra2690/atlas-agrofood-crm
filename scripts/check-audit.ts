
import { prisma } from "../src/lib/prisma";

async function main() {
    try {
        console.log("Checking ActivityLog table...");
        const count = await prisma.activityLog.count();
        console.log(`Success! Found ${count} activity logs.`);

        const logs = await prisma.activityLog.findMany({ take: 5 });
        console.log("Sample logs:", JSON.stringify(logs, null, 2));
    } catch (e) {
        console.error("Error accessing ActivityLog:", e);
    }
}

main();
