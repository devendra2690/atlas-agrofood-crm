import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";
import { auth } from "@/auth";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const url = new URL(request.url);
        const templateOnly = url.searchParams.get("template") === "true";
        const requestedType = url.searchParams.get("type"); // "vendor" or default

        let dataRows: any[] = [];

        const isVendorView = requestedType === "vendor";
        const isPartnerView = requestedType === "partner";
        const targetTypes = isVendorView ? ["VENDOR"] : isPartnerView ? ["PARTNER"] : ["CLIENT", "PROSPECT"];
        const sheetTitle = isVendorView ? "Vendors" : isPartnerView ? "Partners" : "Clients & Prospects";

        if (!templateOnly) {
            // Fetch existing records
            const companies = await prisma.company.findMany({
                where: {
                    type: {
                        in: targetTypes as any
                    }
                },
                include: {
                    country: true,
                    state: true,
                    city: true,
                    commodities: true
                },
                orderBy: {
                    createdAt: "desc"
                }
            });

            dataRows = companies.map(company => ({
                "System ID (Do Not Modify)": company.id,
                "Company Name*": company.name,
                "Type*": company.type,
                "Phone*": company.phone || "",
                "Email": company.email || "",
                "Website": company.website || "",
                "Contact Name": company.contactName || "",
                "Country": company.country?.name || "",
                "State": company.state?.name || "",
                "City": company.city?.name || "",
                "Commodities": company.commodities.map(c => c.name).join(", ")
            }));
        }

        // If it's just a template or there is no data, provide at least one empty instructional row
        if (dataRows.length === 0) {
            dataRows = [
                {
                    "System ID (Do Not Modify)": "",
                    "Company Name*": isVendorView ? "Example Logistics Vendor (Required)" : isPartnerView ? "Example Supply Partner (Required)" : "Example Corp (Required)",
                    "Type*": isVendorView ? "VENDOR" : isPartnerView ? "PARTNER" : "CLIENT", // or PROSPECT
                    "Phone*": "+1234567890",
                    "Email": "info@example.com",
                    "Website": "www.example.com",
                    "Contact Name": "John Doe",
                    "Country": "United States",
                    "State": "California",
                    "City": "Los Angeles",
                    "Commodities": "Banana, Onion"
                }
            ];
        }

        // Create a new workbook and worksheet
        const worksheet = XLSX.utils.json_to_sheet(dataRows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetTitle);

        // Adjust column widths for better readability
        const colWidths = [
            { wch: 35 }, // System ID
            { wch: 30 }, // Company Name*
            { wch: 15 }, // Type*
            { wch: 20 }, // Phone
            { wch: 30 }, // Email
            { wch: 25 }, // Website
            { wch: 20 }, // Contact Name
            { wch: 20 }, // Country
            { wch: 20 }, // State
            { wch: 20 }, // City
            { wch: 40 }  // Commodities
        ];
        worksheet["!cols"] = colWidths;

        // Generate buffer
        const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

        const filename = isVendorView ? "Vendor_Data.xlsx" : isPartnerView ? "Partner_Data.xlsx" : "Client_Prospect_Data.xlsx";

        // Set headers for download
        const headers = new Headers();
        headers.append("Content-Disposition", `attachment; filename="${filename}"`);
        headers.append("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

        return new NextResponse(buffer, {
            status: 200,
            headers: headers
        });
    } catch (error) {
        console.error("Export error:", error);
        return new NextResponse("Failed to export data", { status: 500 });
    }
}
