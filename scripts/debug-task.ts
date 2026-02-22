
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Connecting to database...');

        // 1. Get Admin User
        const admin = await prisma.user.findFirst({
            where: { role: 'ADMIN' }
        });

        if (!admin) {
            console.error('No admin user found!');
            return;
        }

        console.log('Found admin user:', admin.id, admin.name);

        // 2. Mock Data
        const data = {
            content: "Test Debug Task",
            priority: "MEDIUM",
            dueDate: new Date(),
            assignedToId: admin.id, // Assign to self
            userId: admin.id
        };

        console.log('Attempting to create todo with data:', data);

        // 3. Create Todo
        const todo = await prisma.todo.create({
            data: {
                content: data.content,
                priority: "MEDIUM",
                status: "PENDING",
                dueDate: data.dueDate,
                userId: data.userId,
                assignedToId: data.assignedToId
            }
        });

        console.log('SUCCESS! Todo created:', todo);

        // 4. Test Notification Creation (Part of the failure might be here)
        if (data.assignedToId) {
            console.log('Attempting to create notification...');
            await prisma.notification.create({
                data: {
                    userId: data.assignedToId,
                    title: "Test Notification",
                    message: "You were assigned a task",
                    link: "/tasks"
                }
            });
            console.log('SUCCESS! Notification created');
        }

    } catch (error) {
        console.error('FAILURE! Error creating todo:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
