
import { Suspense } from "react";
import { getPurchaseOrders } from "@/app/actions/procurement";
import { PurchaseOrderList } from "./_components/purchase-order-list";
import { CreatePurchaseOrderDialog } from "./_components/create-po-dialog";
import { Separator } from "@/components/ui/separator";
import { PaginationControls } from "@/components/ui/pagination-controls";

export default async function PurchaseOrdersPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const params = await searchParams;
    const page = typeof params.page === 'string' ? parseInt(params.page) : 1;
    const limit = 10;

    const { data: orders, pagination } = await getPurchaseOrders({
        page,
        limit
    });

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Purchase Orders ({pagination?.total || orders?.length || 0})</h2>
                    <p className="text-sm text-muted-foreground">Manage vendor purchase orders.</p>
                </div>
                <CreatePurchaseOrderDialog />
            </div>
            <Separator className="my-4" />
            <Suspense fallback={<div>Loading orders...</div>}>
                <PurchaseOrderList orders={orders || []} />
            </Suspense>
            {pagination && (
                <PaginationControls
                    hasNextPage={pagination.page < pagination.totalPages}
                    hasPrevPage={pagination.page > 1}
                    totalPages={pagination.totalPages}
                    currentPage={pagination.page}
                />
            )}
        </div>
    );
}
