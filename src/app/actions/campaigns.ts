
"use server";

import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/mail";
import { sendSesEmail, checkSesConfig } from "@/lib/ses";
import { GeneralCampaignEmail } from "@/components/email/general-campaign";
import { auth } from "@/auth";
import { render } from "@react-email/render";

export async function getRecipients(filters: { type: 'ALL' | 'COMMODITY' | 'LOCATION'; commodityId?: string; countryId?: string; stateId?: string }) {

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

        if (filters.type === 'LOCATION') {
            if (filters.countryId) {
                where.countryId = filters.countryId;
            }
            if (filters.stateId) {
                where.stateId = filters.stateId;
            }
        }

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

        return { success: true, count: validRecipients.length, data: validRecipients };
    } catch (error) {
        console.error("Failed to fetch recipients:", error);
        return { success: false, error: "Failed to fetch recipients" };
    }
}

export async function sendCampaign(data: { recipientIds: string[]; subject: string; content: string; senderType: "DEFAULT" | "ME"; service: "RESEND" | "SES" | "AUTO" }) {
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


                // Determine Provider (Smart Routing)
                let selectedProvider = data.service;

                if (data.service === 'AUTO') {
                    // Check Resend Usage
                    const now = new Date();
                    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

                    const dailyCount = await prisma.emailLog.count({
                        where: {
                            provider: 'RESEND',
                            sentAt: { gte: startOfDay }
                        }
                    });

                    const monthlyCount = await prisma.emailLog.count({
                        where: {
                            provider: 'RESEND',
                            sentAt: { gte: startOfMonth }
                        }
                    });

                    // Limits: 300/day, 3000/month
                    if (dailyCount >= 300 || monthlyCount >= 3000) {
                        selectedProvider = 'SES';
                        console.log(`[SmartRouting] Resend limit reached (Daily: ${dailyCount}, Monthly: ${monthlyCount}). Switching to SES.`);
                    } else {
                        selectedProvider = 'RESEND';
                    }
                }

                // Send based on provider
                if (selectedProvider === 'SES') {
                    // AWS SES
                    if (!checkSesConfig()) {
                        throw new Error("AWS SES credentials not configured");
                    }

                    await sendSesEmail({
                        from,
                        to: recipient.email,
                        replyTo,
                        subject: data.subject,
                        html: await render(emailHtml),
                    });

                    successCount++;
                    // Log Success
                    await prisma.emailLog.create({
                        data: {
                            provider: 'SES',
                            recipientEmail: recipient.email,
                            subject: data.subject,
                            campaignId: 'manual-campaign'
                        }
                    });

                } else {
                    // Resend (Default)
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
                        successCount++;
                        // Log Success
                        await prisma.emailLog.create({
                            data: {
                                provider: 'RESEND',
                                recipientEmail: recipient.email,
                                subject: data.subject,
                                campaignId: 'manual-campaign'
                            }
                        });
                    }
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

