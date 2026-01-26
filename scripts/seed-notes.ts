
import { prisma } from "../src/lib/prisma";

async function main() {
    console.log("Seeding notes...");

    const user = await prisma.user.findFirst();
    if (!user) {
        console.error("No user found.");
        return;
    }

    const notes = [
        {
            content: "Review Q1 Sales Targets with team",
            priority: "HIGH",
            status: "PENDING",
            userId: user.id
        },
        {
            content: "Call Vendor ABC regarding shipment delay",
            priority: "MEDIUM",
            status: "IN_PROGRESS",
            userId: user.id
        },
        {
            content: "Update office pantry inventory",
            priority: "LOW",
            status: "PENDING",
            userId: user.id
        },
        {
            content: "Draft contract for new client XYZ",
            priority: "HIGH",
            status: "COMPLETED",
            userId: user.id
        }
    ];

    for (const note of notes) {
        await prisma.todo.create({ data: note as any });
    }

    console.log("Seeded notes.");
}

main();
