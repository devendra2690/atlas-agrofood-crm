'use server'

import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { signIn, auth } from "@/auth";
import { sendWelcomeEmail } from "./email";
import { logActivity } from "./audit";

/**
 * Creates an invitation token for a new user
 */
export async function createInvitation(email: string, role: 'SALES' | 'PROCUREMENT' | 'FINANCE' | 'ADMIN') {
    try {
        const session = await auth();
        // @ts-ignore
        if (session?.user?.role !== 'ADMIN') {
            return { success: false, error: "Unauthorized: Admin access required" };
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return { success: false, error: "User already registered" };
        }

        // Generate token
        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Save invitation (upsert to allow re-inviting)
        await prisma.invitation.upsert({
            where: { email },
            update: { token, expiresAt, status: "PENDING", role },
            create: { email, token, expiresAt, role }
        });

        // In a real app, send email here. For now, return the link.
        // Assuming localhost or deployment URL from env?
        // We will just return the full path relative to origin for now or constructing full URL if strict.
        // Let's just return the token and the path.

        await logActivity({
            action: "CREATE",
            entityType: "Invitation",
            entityId: email,
            details: `Invited user ${email} as ${role}`
        });

        return { success: true, token, path: `/register?token=${token}` };
    } catch (error) {
        console.error("Failed to create invitation:", error);
        return { success: false, error: "Failed to create invitation" };
    }
}

/**
 * Registers a user using a valid invitation token
 */
export async function registerWithToken(token: string, password: string, name: string) {
    try {
        const invitation = await prisma.invitation.findUnique({
            where: { token }
        });

        if (!invitation || invitation.status !== "PENDING") {
            return { success: false, error: "Invalid or used invitation" };
        }

        if (new Date() > invitation.expiresAt) {
            return { success: false, error: "Invitation expired" };
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create User
        const user = await prisma.user.create({
            data: {
                email: invitation.email,
                name: name,
                password: hashedPassword,
                role: invitation.role,
                image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}` // Random avatar
            }
        });

        // Send Welcome Email
        await sendWelcomeEmail(user.email, user.name || "User");

        // Mark invitation as accepted
        await prisma.invitation.update({
            where: { id: invitation.id },
            data: { status: "ACCEPTED" }
        });

        await logActivity({
            action: "CREATE",
            entityType: "User",
            entityId: user.id,
            details: `User registered: ${name}`
        });

        return { success: true };
    } catch (error) {
        console.error("Failed to register:", error);
        return { success: false, error: "Failed to register" };
    }
}

export async function getTeamMembers() {
    try {
        const session = await auth();
        // @ts-ignore
        if (!session?.user) {
            return [];
        }

        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return users;
    } catch (error) {
        return [];
    }
}
