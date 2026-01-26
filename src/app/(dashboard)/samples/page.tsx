import { getAllSamples } from "@/app/actions/sample";
import { SampleList } from "../procurement/_components/sample-list";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FlaskConical } from "lucide-react";
import { SampleFilters } from "./_components/sample-filters";
import { getCommodities } from "@/app/actions/commodity";

import { PaginationControls } from "@/components/ui/pagination-controls";

export default async function SamplesPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const params = await searchParams;
    const location = typeof params.location === 'string' ? params.location : undefined;
    const commodityId = typeof params.commodityId === 'string' ? params.commodityId : undefined;
    const trustLevel = typeof params.trustLevel === 'string' ? params.trustLevel : undefined;

    // Pagination
    const page = typeof params.page === 'string' ? parseInt(params.page) : 1;
    const limit = 10;

    const { data: samples, pagination } = await getAllSamples({
        location,
        commodityId,
        trustLevel,
        page,
        limit
    });

    const { data: commodities } = await getCommodities();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Samples Registry</h2>
                    <p className="text-muted-foreground">
                        Track all material samples requested across all projects.
                    </p>
                </div>
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-purple-100">
                    <FlaskConical className="h-6 w-6 text-purple-600" />
                </div>
            </div>

            <SampleFilters commodities={commodities || []} />

            <Card>
                <CardHeader>
                    <CardTitle>All Samples</CardTitle>
                    <CardDescription>
                        Unified view of sample statuses.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <SampleList samples={samples || []} />
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
