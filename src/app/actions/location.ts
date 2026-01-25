'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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
        revalidatePath("/settings");
        return { success: true, data: country };
        // ... (I will use replace_file_content to update all catch blocks)
    } catch (error: any) {
        console.error("Failed to create country:", error);
        return { success: false, error: error.message || "Failed to create country" };
    }
    // ... look for patterns
}

export async function deleteCountry(id: string) {
    try {
        await prisma.country.delete({ where: { id } });
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
        revalidatePath("/settings");
        return { success: true, data: state };
    } catch (error) {
        return { success: false, error: "Failed to create state" };
    }
}

export async function deleteState(id: string) {
    try {
        await prisma.state.delete({ where: { id } });
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
        revalidatePath("/settings");
        return { success: true, data: city };
    } catch (error) {
        return { success: false, error: "Failed to create city" };
    }
}

export async function deleteCity(id: string) {
    try {
        await prisma.city.delete({ where: { id } });
        revalidatePath("/settings");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to delete city" };
    }
}
