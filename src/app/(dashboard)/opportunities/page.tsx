import { getOpportunities } from "@/app/actions/opportunity";
import { getCompanies } from "@/app/actions/company";
import { getCommodities } from "@/app/actions/commodity";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { OpportunityList } from "./_components/opportunity-list";
import { OpportunityDialog } from "./_components/opportunity-dialog";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { OpportunityFilters } from "./_components/opportunity-filters";

export default async function OpportunitiesPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const params = await searchParams;
    const page = typeof params.page === 'string' ? parseInt(params.page) : 1;
    const limit = 10;
    const query = typeof params.query === 'string' ? params.query : undefined;
    const status = typeof params.status === 'string' ? params.status : undefined;
    const date = typeof params.date === 'string' ? params.date : undefined;
    const highlight = typeof params.highlight === 'string' ? params.highlight : undefined;

    console.log(`DEBUG: Page ${page}, Highlight: ${highlight}`);

    const { data: opportunities, pagination } = await getOpportunities({
        page,
        limit,
        query,
        status,
        date,
        priorityId: highlight
    });
    const { data: companies } = await getCompanies();
    const { data: allCommodities } = await getCommodities();

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
                <OpportunityDialog companies={clientOptions} commodities={allCommodities || []} />
            </div>

            <OpportunityFilters />

            <Card>
                <CardHeader>
                    <CardTitle>Active Deals</CardTitle>
                    <CardDescription>
                        Track progress on all open opportunities.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <OpportunityList
                        opportunities={opportunities || []}
                        companies={clientOptions}
                        commodities={allCommodities || []}
                        initialExpandedId={highlight}
                    />
                    {pagination && (
                        <PaginationControls
                            hasNextPage={pagination.page < pagination.totalPages}
                            hasPrevPage={pagination.page > 1}
                            totalPages={pagination.totalPages}
                            currentPage={pagination.page}
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
