
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const users = await prisma.user.findMany();
        console.log(`Found ${users.length} Users:`);
        users.forEach(u => {
            console.log(`- ${u.name} (${u.email}) [ID: ${u.id}]`);
        });
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
