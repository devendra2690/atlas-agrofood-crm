import { Suspense } from "react";
import { getSalesOrders } from "@/app/actions/order";
import { SalesOrderList } from "./_components/sales-order-list";
import { Separator } from "@/components/ui/separator";

export default async function SalesOrdersPage() {
    const { data: orders } = await getSalesOrders();

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Sales Orders ({orders?.length || 0})</h2>
                    <p className="text-sm text-muted-foreground">Manage confirmed client orders.</p>
                </div>
            </div>
            <Separator className="my-4" />
            <Suspense fallback={<div>Loading orders...</div>}>
                <SalesOrderList orders={orders || []} />
            </Suspense>
        </div>
    );
}
