import { getCommodities } from "@/app/actions/commodity";
import { getCompanies } from "@/app/actions/company";
import { QuoteCalculator } from "@/components/tools/quote-calculator";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Quote Rate Calculator | Atlas Agrofood",
    description: "Calculate product landing prices",
};

export default async function QuoteCalculatorPage() {
    const { data: commodities } = await getCommodities();
    const { data: companies } = await getCompanies({ limit: 1000 }); // Fetch all companies for dropdown

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Quote Rate Calculator</h2>
                    <p className="text-muted-foreground">
                        Calculate specific landing prices based on batch parameters and master data.
                    </p>
                </div>
            </div>

            <div className="mt-6">
                <QuoteCalculator commodities={commodities || []} companies={companies || []} />
            </div>
        </div>
    );
}
