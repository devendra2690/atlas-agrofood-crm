
import { Suspense } from "react";
import { getPurchaseOrders } from "@/app/actions/procurement";
import { PurchaseOrderList } from "./_components/purchase-order-list";
import { CreatePurchaseOrderDialog } from "./_components/create-po-dialog";
import { Separator } from "@/components/ui/separator";

export default async function PurchaseOrdersPage() {
    const { data: orders } = await getPurchaseOrders();

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Purchase Orders ({orders?.length || 0})</h2>
                    <p className="text-sm text-muted-foreground">Manage vendor purchase orders.</p>
                </div>
                <CreatePurchaseOrderDialog />
            </div>
            <Separator className="my-4" />
            <Suspense fallback={<div>Loading orders...</div>}>
                <PurchaseOrderList orders={orders || []} />
            </Suspense>
        </div>
    );
}
