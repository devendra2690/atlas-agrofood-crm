'use server';

import { prisma } from "@/lib/prisma";

export async function getEmailLogs() {
    try {
        const logs = await prisma.emailLog.findMany({
            orderBy: {
                sentAt: 'desc'
            },
            take: 100 // Limit for now
        });

        return { success: true, data: logs };
    } catch (error) {
        console.error("Failed to fetch email logs:", error);
        return { success: false, error: "Failed to fetch logs" };
    }
}
