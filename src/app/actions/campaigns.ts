
"use server";

import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/mail";
import { GeneralCampaignEmail } from "@/components/email/general-campaign";
import { auth } from "@/auth";

export async function getRecipients(filters: { type: 'ALL' | 'COMMODITY'; commodityId?: string }) {
    try {
        const where: any = {
            email: { not: null }, // Only those with emails
            status: "ACTIVE" // Optional: only active companies
        };

        if (filters.type === 'COMMODITY' && filters.commodityId) {
            where.commodities = {
                some: {
                    id: filters.commodityId
                }
            };
        }

        console.log("getRecipients DEBUG:", { filters, where }); // DEBUG

        const recipients = await prisma.company.findMany({
            where,
            select: {
                id: true,
                name: true,
                email: true,
                type: true // e.g. VENDOR or CLIENT
            }
        });

        // Filter out empty strings if any escaped the 'not: null' check
        const validRecipients = recipients.filter(r => r.email && r.email.includes('@'));

        console.log("getRecipients FOUND:", validRecipients.length); // DEBUG

        return { success: true, count: validRecipients.length, data: validRecipients };
    } catch (error) {
        console.error("Failed to fetch recipients:", error);
        return { success: false, error: "Failed to fetch recipients" };
    }
}

export async function sendCampaign(data: { recipientIds: string[]; subject: string; content: string; senderType: "DEFAULT" | "ME" }) {
    try {
        const session = await auth();
        // In a real app, you might queue this. For now, we loop and await (slow but works for small batches).

        const recipients = await prisma.company.findMany({
            where: {
                id: { in: data.recipientIds }
            },
            select: { email: true, name: true }
        });

        if (recipients.length === 0) {
            return { success: false, error: "No valid recipients found" };
        }

        const emailHtml = await GeneralCampaignEmail({
            subject: data.subject,
            content: data.content,
            senderName: session?.user?.name || "Atlas Agro Food Team"
        });

        let successCount = 0;
        let failureCount = 0;

        // BATCH SENDING or LOOP
        // Resend supports batching, but let's do safe loop for now to avoid complexity with Types.
        for (const recipient of recipients) {
            if (!recipient.email) continue;
            try {
                // Determine TO address
                // In DEV mode, resend restricts to verified domain. 
                // We should probably safeguard this if we don't want to crash.
                // Assuming user knows this limitation.

                // Determine Sender
                let from = "Atlas Agro Food <sales@atlasagrofood.co.in>";
                let replyTo: string | undefined = undefined;

                if (data.senderType === "ME" && session?.user) {
                    const userName = session.user.name || "Atlas Team";
                    const userEmail = session.user.email;

                    // If user's email is on the verified domain, use it directly
                    if (userEmail && userEmail.endsWith("@atlasagrofood.co.in")) {
                        from = `${userName} <${userEmail}>`;
                    } else {
                        // Otherwise, use "On Behalf Of" pattern with Reply-To
                        from = `${userName} <sales@atlasagrofood.co.in>`;
                        if (userEmail) replyTo = userEmail;
                    }
                }

                const response = await resend.emails.send({
                    from,
                    to: recipient.email,
                    replyTo,
                    subject: data.subject,
                    react: emailHtml,
                });

                if (response.error) {
                    console.error(`Resend API Error for ${recipient.email}:`, response.error);
                    failureCount++;
                } else {
                    console.log(`Email sent to ${recipient.email}. ID: ${response.data?.id}`);
                    successCount++;
                }
            } catch (err) {
                console.error(`Failed to send to ${recipient.email}:`, err);
                failureCount++;
            }
        }

        return { success: true, sent: successCount, failed: failureCount };
    } catch (error) {
        console.error("Campaign execution failed:", error);
        return { success: false, error: "Campaign failed" };
    }
}
