"use server";

import { resend } from "@/lib/mail";
import { OrderConfirmationEmail } from "@/components/email/order-confirmation";
import { WelcomeEmail } from "@/components/email/welcome-email";
import { ClientWelcomeEmail } from "@/components/email/client-welcome";
import { prisma } from "@/lib/prisma"; // Assuming we might need DB access for complex data gathering later

const FROM_EMAIL = "Atlas Agro Food <sales@atlasagrofood.co.in>";

export async function sendOrderConfirmationEmail(orderId: string) {
    try {
        // Fetch order details
        const order = await prisma.salesOrder.findUnique({
            where: { id: orderId },
            include: {
                client: true,
                opportunity: true,
                // In a real app, you'd fetch line items. 
                // For now, let's assume the opportunity IS the item or we have items relation.
                // Based on schema, we don't have explicit line items table yet, usually tied to Opportunity product.
            }
        });

        if (!order || !order.client.email) {
            console.error("Order or client email not found");
            return { success: false, error: "Order details missing" };
        }

        const emailHtml = await OrderConfirmationEmail({
            orderId: order.id.slice(0, 8).toUpperCase(),
            customerName: order.client.name,
            totalAmount: Number(order.totalAmount),
            orderDate: order.createdAt.toLocaleDateString(),
            items: [
                {
                    product: order.opportunity.productName,
                    quantity: Number(order.opportunity.quantity || 1),
                    price: Number(order.opportunity.targetPrice || 0)
                }
            ]
        });

        const data = await resend.emails.send({
            from: FROM_EMAIL,
            to: order.client.email, // In dev, this might be restricted to verified email
            subject: `Order Confirmation #${order.id.slice(0, 8).toUpperCase()}`,
            react: emailHtml,
        });

        console.log("Email sent:", data);
        return { success: true, data };
    } catch (error) {
        console.error("Failed to send order confirmation email:", error);
        return { success: false, error: "Failed to send email" };
    }
}

export async function sendWelcomeEmail(email: string, name: string) {
    try {
        const data = await resend.emails.send({
            from: FROM_EMAIL,
            to: email,
            subject: "Welcome to Atlas Agro CRM",
            react: WelcomeEmail({ name }),
        });

        return { success: true, data };
    } catch (error) {
        console.error("Failed to send welcome email:", error);
        return { success: false, error: "Failed to send email" };
    }
}

export async function sendClientWelcomeEmail(email: string, clientName: string) {
    try {
        console.log(`Attempting to send welcome email to: ${email}`);
        const data = await resend.emails.send({
            from: FROM_EMAIL,
            to: email,
            subject: "Welcome to Atlas Agro Food",
            react: ClientWelcomeEmail({ clientName }),
        });

        console.log("Resend API Response:", JSON.stringify(data, null, 2));

        if (data.error) {
            console.error("Resend returned an error:", data.error);
        }

        return { success: true, data };
    } catch (error) {
        console.error("Failed to send client welcome email:", error);
        return { success: false, error: "Failed to send email" };
    }
}
