
import { getActivities } from "@/app/actions/audit";
import { ActivityList } from "./_components/activity-list";
import { ActivityFilters } from "./_components/activity-filters";
import { PaginationControls } from "@/components/ui/pagination-controls";

import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function ActivityPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
        redirect("/");
    }

    const params = await searchParams;
    const page = typeof params.page === 'string' ? parseInt(params.page) : 1;
    const entityType = typeof params.entityType === 'string' ? params.entityType : undefined;
    const userId = typeof params.userId === 'string' ? params.userId : undefined;
    const query = typeof params.query === 'string' ? params.query : undefined;
    const limit = 20;

    const { data: activities, success, pagination } = await getActivities({
        page,
        limit,
        entityType,
        userId,
        query
    });

    if (!success) {
        return <div className="p-8">Failed to load activity log.</div>;
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Activity Log</h2>
            </div>

            <ActivityFilters />

            <ActivityList activities={activities || []} />

            {pagination && (
                <div className="mt-4">
                    <PaginationControls
                        hasNextPage={pagination.page < pagination.totalPages}
                        hasPrevPage={pagination.page > 1}
                        totalPages={pagination.totalPages}
                        currentPage={pagination.page}
                    />
                </div>
            )}
        </div>
    );
}
