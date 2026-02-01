"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { logActivity } from "./audit";

export async function updateProfile(formData: { name: string }) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        await prisma.user.update({
            where: { id: session.user.id },
            data: { name: formData.name }
        });

        await logActivity({
            action: "UPDATE",
            entityType: "User",
            entityId: session.user.id,
            details: "Updated profile information"
        });

        revalidatePath("/settings/profile");
        return { success: true };
    } catch (error) {
        console.error("Failed to update profile:", error);
        return { success: false, error: "Failed to update profile" };
    }
}

export async function changePassword(formData: { oldPassword: string; newPassword: string }) {
    console.log("Change Password Request Started");
    const session = await auth();
    console.log("Session User ID:", session?.user?.id);

    if (!session?.user?.id) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id }
        });

        if (!user || !user.password) {
            console.log("User not found or no password set");
            return { success: false, error: "User not found or no password set" };
        }

        const passwordsMatch = await bcrypt.compare(formData.oldPassword, user.password);
        console.log("Old password match result:", passwordsMatch);

        if (!passwordsMatch) {
            return { success: false, error: "Incorrect current password" };
        }

        const hashedPassword = await bcrypt.hash(formData.newPassword, 10);
        console.log("New password hashed. Updating DB...");

        await prisma.user.update({
            where: { id: session.user.id },
            data: { password: hashedPassword }
        });

        console.log("Password updated successfully in DB");

        await logActivity({
            action: "UPDATE",
            entityType: "User",
            entityId: session.user.id,
            details: "Changed password"
        });

        revalidatePath("/settings/profile");
        return { success: true };
    } catch (error) {
        console.error("Failed to update password:", error);
        return { success: false, error: "Failed to update password" };
    }
}
