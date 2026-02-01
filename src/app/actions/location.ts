'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { logActivity } from "./audit";

// --- Country ---

export async function getCountries() {
    try {
        const countries = await prisma.country.findMany({
            orderBy: { name: 'asc' }
        });
        return { success: true, data: countries };
    } catch (error) {
        return { success: false, error: "Failed to fetch countries" };
    }
}

export async function createCountry(name: string) {
    try {
        const country = await prisma.country.create({
            data: { name }
        });
        await logActivity({
            action: "CREATE",
            entityType: "Country",
            entityId: country.id,
            details: `Created country: ${name}`
        });
        revalidatePath("/settings");
        return { success: true, data: country };
    } catch (error: any) {
        console.error("Failed to create country:", error);
        return { success: false, error: error.message || "Failed to create country" };
    }
}

export async function deleteCountry(id: string) {
    try {
        await prisma.country.delete({ where: { id } });
        await logActivity({
            action: "DELETE",
            entityType: "Country",
            entityId: id,
            details: "Deleted country"
        });
        revalidatePath("/settings");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to delete country" };
    }
}

// --- State ---

export async function getStates(countryId: string) {
    try {
        const states = await prisma.state.findMany({
            where: { countryId },
            orderBy: { name: 'asc' }
        });
        return { success: true, data: states };
    } catch (error) {
        return { success: false, error: "Failed to fetch states" };
    }
}

export async function createState(name: string, countryId: string) {
    try {
        const state = await prisma.state.create({
            data: { name, countryId }
        });
        await logActivity({
            action: "CREATE",
            entityType: "State",
            entityId: state.id,
            details: `Created state: ${name}`
        });
        revalidatePath("/settings");
        return { success: true, data: state };
    } catch (error) {
        return { success: false, error: "Failed to create state" };
    }
}

export async function deleteState(id: string) {
    try {
        await prisma.state.delete({ where: { id } });
        await logActivity({
            action: "DELETE",
            entityType: "State",
            entityId: id,
            details: "Deleted state"
        });
        revalidatePath("/settings");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to delete state" };
    }
}

// --- City ---

export async function getCities(stateId: string) {
    try {
        const cities = await prisma.city.findMany({
            where: { stateId },
            orderBy: { name: 'asc' }
        });
        return { success: true, data: cities };
    } catch (error) {
        return { success: false, error: "Failed to fetch cities" };
    }
}

export async function createCity(name: string, stateId: string) {
    try {
        const city = await prisma.city.create({
            data: { name, stateId }
        });
        await logActivity({
            action: "CREATE",
            entityType: "City",
            entityId: city.id,
            details: `Created city: ${name}`
        });
        revalidatePath("/settings");
        return { success: true, data: city };
    } catch (error) {
        return { success: false, error: "Failed to create city" };
    }
}

export async function deleteCity(id: string) {
    try {
        await prisma.city.delete({ where: { id } });
        await logActivity({
            action: "DELETE",
            entityType: "City",
            entityId: id,
            details: "Deleted city"
        });
        revalidatePath("/settings");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to delete city" };
    }
}
