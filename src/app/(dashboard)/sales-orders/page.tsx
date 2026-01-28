import { Suspense } from "react";
import { getSalesOrders } from "@/app/actions/order";
import { SalesOrderList } from "./_components/sales-order-list";
import { Separator } from "@/components/ui/separator";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { SalesOrderFilters } from "./_components/sales-order-filters";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SalesOrderBoard } from "./_components/kanban-board";
import { SalesOrderStatus } from "@prisma/client";

export default async function SalesOrdersPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const params = await searchParams;
    const page = typeof params.page === 'string' ? parseInt(params.page) : 1;
    const limit = 10;
    const query = typeof params.query === 'string' ? params.query : undefined;
    const status = typeof params.status === 'string' ? params.status as SalesOrderStatus : undefined;
    const date = typeof params.date === 'string' ? params.date : undefined;

    const { data: orders, pagination } = await getSalesOrders({
        page,
        limit,
        query,
        status,
        date
    });

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Sales Orders ({pagination?.total || orders?.length || 0})</h2>
                    <p className="text-sm text-muted-foreground">Manage confirmed client orders.</p>
                </div>
            </div>
            <Separator className="my-4" />

            <SalesOrderFilters />

            <Tabs defaultValue="board" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="list">List View</TabsTrigger>
                    <TabsTrigger value="board">Kanban Board</TabsTrigger>
                </TabsList>
                <TabsContent value="list" className="space-y-4">
                    <Suspense fallback={<div>Loading orders...</div>}>
                        <SalesOrderList orders={orders || []} />
                    </Suspense>
                    {pagination && (
                        <PaginationControls
                            hasNextPage={pagination.page < pagination.totalPages}
                            hasPrevPage={pagination.page > 1}
                            totalPages={pagination.totalPages}
                            currentPage={pagination.page}
                        />
                    )}
                </TabsContent>
                <TabsContent value="board" className="pt-2">
                    <Suspense fallback={<div>Loading board...</div>}>
                        <SalesOrderBoard orders={orders || []} />
                    </Suspense>
                </TabsContent>
            </Tabs>
        </div>
    );
}
