import { getOpportunities } from "@/app/actions/opportunity";
import { getCompanies } from "@/app/actions/company";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { OpportunityList } from "./_components/opportunity-list";
import { OpportunityDialog } from "./_components/opportunity-dialog";

export default async function OpportunitiesPage() {
    const { data: opportunities } = await getOpportunities();
    const { data: companies } = await getCompanies();

    // Filter only companies that are clients or prospects for the dropdown
    const clientOptions = companies?.filter(c => c.type === 'CLIENT' || c.type === 'PROSPECT').map(c => ({
        id: c.id,
        name: c.name,
        commodities: c.commodities // Pass commodities
    })) || [];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Sales Opportunities</h2>
                    <p className="text-muted-foreground">
                        Manage your active deals and pipeline. Click on a row to view details.
                    </p>
                </div>
                <OpportunityDialog companies={clientOptions} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Active Deals</CardTitle>
                    <CardDescription>
                        Track progress on all open opportunities.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <OpportunityList opportunities={opportunities || []} companies={clientOptions} />
                </CardContent>
            </Card>
        </div>
    );
}
