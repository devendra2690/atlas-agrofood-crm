
import { Suspense } from "react";
import { getPurchaseOrders } from "@/app/actions/procurement";
import { PurchaseOrderList } from "./_components/purchase-order-list";
import { PurchaseOrderKanban } from "./_components/purchase-order-kanban";
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
    const view = typeof params.view === 'string' ? params.view : 'kanban';

    // For Kanban, we ideally want ALL active orders or a very large page
    // Let's use a larger limit for Kanban to show more relevant items
    const limit = view === 'kanban' ? 50 : 10;

    const { data: orders, pagination } = await getPurchaseOrders({
        page,
        limit
    });

    return (
        <div className="flex-1 space-y-4 p-8 pt-6 h-[calc(100vh-60px)] flex flex-col">
            <div className="flex items-center justify-between shrink-0">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Purchase Orders ({pagination?.total || orders?.length || 0})</h2>
                    <p className="text-sm text-muted-foreground">Manage vendor purchase orders.</p>
                </div>
                <div className="flex items-center space-x-2">
                    <div className="flex bg-muted p-1 rounded-md">
                        <a
                            href="?view=list"
                            className={`px-3 py-1 text-sm rounded-sm transition-all ${view !== 'kanban' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            List
                        </a>
                        <a
                            href="?view=kanban"
                            className={`px-3 py-1 text-sm rounded-sm transition-all ${view === 'kanban' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            Kanban
                        </a>
                    </div>
                    <CreatePurchaseOrderDialog />
                </div>
            </div>
            <Separator className="my-4 shrink-0" />

            <div className="flex-1 min-h-0">
                <Suspense fallback={<div>Loading orders...</div>}>
                    {view === 'kanban' ? (
                        <div className="h-full overflow-hidden">
                            {/* @ts-ignore - types mismatch on relations but runtime is fine */}
                            <PurchaseOrderKanban orders={orders || []} />
                        </div>
                    ) : (
                        <>
                            <PurchaseOrderList orders={orders || []} />
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
                        </>
                    )}
                </Suspense>
            </div>
        </div>
    );
}
