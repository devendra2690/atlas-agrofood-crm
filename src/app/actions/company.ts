'use server'

import { prisma } from "@/lib/prisma";
import { Company, CompanyType, CompanyStatus, TrustLevel } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { sendClientWelcomeEmail } from "./email";
import { logActivity } from "./audit";

export type CompanyFormData = {
    name: string;
    type: CompanyType;
    phone?: string;
    email?: string;
    countryId?: string;
    stateId?: string;
    cityId?: string;
    commodityIds?: string[];
};

// Helper to clean strings from "undefined" or "$undefined"
const cleanString = (val?: string) => {
    if (!val) return null;
    if (val === "undefined" || val === "$undefined" || val === "null") return null;
    if (val.trim() === "") return null;
    return val;
};

export async function createCompany(data: CompanyFormData) {
    try {
        const session = await auth();

        console.log("createCompany Raw Input:", JSON.stringify(data));

        // Sanitize Input for Create
        const createData: any = {
            name: data.name,
            type: data.type || "PROSPECT", // Fallback if missing
            status: "ACTIVE",
        };

        if (session?.user?.id) {
            createData.createdById = session.user.id;
            createData.updatedById = session.user.id;
        }

        const phone = cleanString(data.phone);
        if (phone) {
            const existingCompany = await prisma.company.findFirst({
                where: { phone: phone }
            });
            if (existingCompany) {
                return { success: false, error: "A company with this phone number already exists." };
            }
            createData.phone = phone;
        }

        const email = cleanString(data.email);
        if (email) createData.email = email;

        const countryId = cleanString(data.countryId);
        if (countryId) createData.countryId = countryId;

        const stateId = cleanString(data.stateId);
        if (stateId) createData.stateId = stateId;

        const cityId = cleanString(data.cityId);
        if (cityId) createData.cityId = cityId;

        if (data.commodityIds && Array.isArray(data.commodityIds) && data.commodityIds.length > 0) {
            // Filter out any garbage IDs just in case
            const validIds = data.commodityIds.filter(id => cleanString(id) !== null);
            if (validIds.length > 0) {
                createData.commodities = {
                    connect: validIds.map(id => ({ id }))
                };
            }
        }

        console.log("createCompany Cleaned Payload:", JSON.stringify(createData, null, 2));

        const company = await prisma.company.create({
            data: createData,
        });

        if (data.email) {
            // Non-blocking email send
            sendClientWelcomeEmail(data.email, data.name).catch(e => console.error("Email failed:", e));
        }

        await logActivity({
            action: "CREATE",
            entityType: "Company",
            entityId: company.id,
            entityTitle: company.name,
            details: `Created company: ${company.name}`
        });

        revalidatePath("/companies");
        return { success: true, data: company };
    } catch (error: any) {
        console.error("Failed to create company:", error);
        return {
            success: false,
            error: `Failed to create company: ${error.message} | Code: ${error.code} | Meta: ${JSON.stringify(error.meta)}`
        };
    }
}

export async function updateCompany(id: string, data: CompanyFormData) {
    try {
        const session = await auth();

        console.log("updateCompany Raw Input:", JSON.stringify(data));

        const updateData: any = {
            name: data.name,
            type: data.type,
        };

        if (session?.user?.id) {
            updateData.updatedById = session.user.id;
        }

        updateData.phone = cleanString(data.phone);
        if (updateData.phone) {
            const existingCompany = await prisma.company.findFirst({
                where: {
                    phone: updateData.phone,
                    NOT: { id: id }
                }
            });
            if (existingCompany) {
                return { success: false, error: "A company with this phone number already exists." };
            }
        }

        updateData.email = cleanString(data.email);
        updateData.countryId = cleanString(data.countryId);
        updateData.stateId = cleanString(data.stateId);
        updateData.cityId = cleanString(data.cityId);

        if (data.commodityIds && Array.isArray(data.commodityIds)) {
            const validIds = data.commodityIds.filter(id => cleanString(id) !== null);
            updateData.commodities = {
                set: validIds.map(id => ({ id }))
            };
        }

        console.log("updateCompany Cleaned Payload:", JSON.stringify(updateData, null, 2));

        const company = await prisma.company.update({
            where: { id },
            data: updateData,
        });

        await logActivity({
            action: "UPDATE",
            entityType: "Company",
            entityId: id,
            details: `Updated company: ${data.name}`
        });

        revalidatePath("/companies");
        revalidatePath(`/companies/${id}`);
        return { success: true, data: company };
    } catch (error: any) {
        console.error("Failed to update company:", error);
        return {
            success: false,
            error: `Failed to update company: ${error.message} | Code: ${error.code} | Meta: ${JSON.stringify(error.meta)}`
        };
    }
}

export async function deleteCompany(id: string) {
    try {
        console.log(`[deleteCompany] Attempting to delete company ID: ${id}`);
        // CHECK DEPENDENCIES FIRST
        const company = await prisma.company.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        projectVendors: true,
                        purchaseOrders: true,
                        salesOrders: true,
                        salesOpportunities: true, // Add this
                        interactions: true,
                    }
                }
            }
        });

        if (!company) {
            console.log(`[deleteCompany] Company not found for ID: ${id}`);
            return { success: false, error: "Company not found" };
        }

        const counts = company._count;
        console.log(`[deleteCompany] Counts for ${company.name}:`, JSON.stringify(counts));

        if (counts.projectVendors > 0 || counts.purchaseOrders > 0 || counts.salesOrders > 0 || counts.salesOpportunities > 0) {
            const errorMsg = `Cannot delete company. It has ${counts.salesOpportunities} opportunities, ${counts.projectVendors} projects, ${counts.purchaseOrders} purchase orders, and ${counts.salesOrders} sales orders linked.`;
            console.log(`[deleteCompany] Deletion blocked: ${errorMsg}`);
            return {
                success: false,
                error: errorMsg
            };
        }

        // Optional: Allow deleting if only interactions exist, but we must delete interactions first
        if (counts.interactions > 0) {
            await prisma.interactionLog.deleteMany({
                where: { companyId: id }
            });
        }

        await prisma.company.delete({
            where: { id }
        });

        await logActivity({
            action: "DELETE",
            entityType: "Company",
            entityId: id,
            details: "Deleted company"
        });

        revalidatePath("/companies");
        return { success: true };
    } catch (error: any) {
        console.error("Failed to delete company:", error);
        return { success: false, error: `Failed to delete company: ${error.message}` };
    }
}

export async function updateCompanyTrustLevel(id: string, trustLevel: TrustLevel) {
    try {
        const session = await auth();
        const company = await prisma.company.update({
            where: { id },
            data: {
                updatedById: session?.user?.id,
                trustLevel
            }
        });

        await logActivity({
            action: "STATUS_CHANGE",
            entityType: "Company",
            entityId: id,
            details: `Updated trust level to ${trustLevel}`
        });

        revalidatePath(`/vendors/${id}`);
        revalidatePath("/vendors");
        revalidatePath("/samples"); // Updates filters
        return { success: true, data: company };
    } catch (error: any) {
        console.error("Failed to update trust level:", error);
        return { success: false, error: "Failed to update trust level" };
    }
}

export async function getCompanies(filters?: {
    query?: string;
    location?: string;
    commodityId?: string;
    trustLevel?: string;
    page?: number;
    limit?: number;
    type?: CompanyType; // Add type filter support if needed/used
}) {
    try {
        const where: any = {
            type: {
                not: "VENDOR"
            }
        };

        if (filters?.trustLevel && filters.trustLevel !== 'all') {
            where.trustLevel = filters.trustLevel as TrustLevel;
        }



        // Refined Logic for Query + Location mixing
        // If both exist, we need AND condition for the groups.
        const conditions: any[] = [];

        if (filters?.type) {
            // We already set type at top level, but let's keep it clean.
        }

        if (filters?.location) {
            conditions.push({
                OR: [
                    { city: { name: { contains: filters.location, mode: 'insensitive' } } },
                    { state: { name: { contains: filters.location, mode: 'insensitive' } } },
                    { country: { name: { contains: filters.location, mode: 'insensitive' } } }
                ]
            });
        }

        if (filters?.query) {
            conditions.push({
                OR: [
                    { name: { contains: filters.query, mode: 'insensitive' } },
                    { email: { contains: filters.query, mode: 'insensitive' } },
                    { phone: { contains: filters.query, mode: 'insensitive' } }
                ]
            });
        }

        if (conditions.length > 0) {
            where.AND = conditions;
        }

        const page = filters?.page || 1;
        const limit = filters?.limit || 10;
        const skip = (page - 1) * limit;

        const [companies, total] = await prisma.$transaction([
            prisma.company.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
                include: {
                    _count: {
                        select: {
                            interactions: true,
                            salesOpportunities: true,
                            projectVendors: true
                        }
                    },
                    commodities: true,
                    country: true,
                    state: true,
                    city: true
                }
            }),
            prisma.company.count({ where })
        ]);

        return {
            success: true,
            data: companies,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    } catch (error: any) {
        console.error("Failed to get companies:", error);
        return { success: false, error: "Failed to fetch companies" };
    }
}

export async function getCompany(id: string) {
    try {
        const company = await prisma.company.findUnique({
            where: { id },
            include: {
                interactions: {
                    orderBy: { date: 'desc' },
                    include: {
                        user: true
                    }
                },
                salesOpportunities: {
                    orderBy: { createdAt: 'desc' }
                },
                projectVendors: {
                    include: {
                        project: true
                    }
                },
                _count: {
                    select: {
                        salesOrders: true,
                        purchaseOrders: true,
                        projectVendors: true
                    }
                },
                commodities: true,
                country: true,
                state: true,
                city: true
            }
        });

        if (!company) {
            return { success: false, error: "Company not found" };
        }

        const safeCompany = {
            ...company,
            salesOpportunities: company.salesOpportunities.map(opp => ({
                ...opp,
                targetPrice: opp.targetPrice?.toNumber(),
                quantity: opp.quantity?.toNumber(),
                procurementQuantity: opp.procurementQuantity?.toNumber(),
            }))
        };

        return { success: true, data: safeCompany };
    } catch (error: any) {
        console.error("Failed to get company:", error);
        return { success: false, error: "Failed to fetch company details" };
    }
}

export async function getVendors(filters?: {
    location?: string;
    commodityId?: string;
    trustLevel?: string;
    page?: number;
    limit?: number;
}) {
    try {
        const where: any = { type: "VENDOR" };
        const page = filters?.page || 1;
        const limit = filters?.limit || 10;
        const skip = (page - 1) * limit;

        if (filters?.location) {
            where.OR = [
                { city: { name: { contains: filters.location, mode: 'insensitive' } } },
                { state: { name: { contains: filters.location, mode: 'insensitive' } } },
                { country: { name: { contains: filters.location, mode: 'insensitive' } } }
            ];
        }

        if (filters?.commodityId && filters.commodityId !== 'all') {
            where.commodities = {
                some: {
                    id: filters.commodityId
                }
            };
        }

        if (filters?.trustLevel && filters.trustLevel !== 'all') {
            where.trustLevel = filters.trustLevel as TrustLevel;
        }

        const [vendors, total] = await prisma.$transaction([
            prisma.company.findMany({
                where,
                orderBy: { name: "asc" },
                skip,
                take: limit,
                include: {
                    _count: {
                        select: {
                            projectVendors: true,
                            purchaseOrders: true,
                            sampleRecords: true
                        }
                    },
                    commodities: true,
                    city: true,
                    state: true,
                    country: true
                }
            }),
            prisma.company.count({ where })
        ]);

        return {
            success: true,
            data: vendors,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    } catch (error: any) {
        console.error("Failed to get vendors:", error);
        return { success: false, error: "Failed to fetch vendors" };
    }
}
