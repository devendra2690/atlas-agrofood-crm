
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const banana = await prisma.commodity.findFirst({
            where: { name: { contains: 'Banana', mode: 'insensitive' } }
        });

        if (!banana) {
            console.error("Banana commodity not found!");
            return;
        }

        console.log(`Using Commodity: ${banana.name}`);

        // Create Vendor linked to Banana
        await prisma.company.create({
            data: {
                name: "Santosh Patil Akot",
                type: "VENDOR",
                email: "santosh@example.com",
                status: "ACTIVE",
                commodities: {
                    connect: { id: banana.id }
                }
            }
        });
        console.log("Created 'Santosh Patil Akot' (Vendor) -> Banana");

        // Create Client linked to Banana
        await prisma.company.create({
            data: {
                name: "Best Fruits Ltd",
                type: "CLIENT",
                email: "buyer@example.com",
                status: "ACTIVE",
                commodities: {
                    connect: { id: banana.id }
                }
            }
        });
        console.log("Created 'Best Fruits Ltd' (Client) -> Banana");

        // Create Vendor NOT linked to Banana (Control)
        await prisma.company.create({
            data: {
                name: "Rice Traders Inc",
                type: "VENDOR",
                email: "rice@example.com",
                status: "ACTIVE"
            } // No commodities
        });
        console.log("Created 'Rice Traders Inc' (Vendor) -> No Banana");

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
