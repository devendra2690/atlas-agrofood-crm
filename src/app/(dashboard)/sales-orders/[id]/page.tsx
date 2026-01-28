
import { Suspense } from "react";
import { getSalesOrder } from "@/app/actions/order";
import { notFound } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { SalesOrderDetailsClient } from "./_components/sales-order-details-client";

import { getSalesOrderFinancials, getSalesOrderTransactions } from "@/app/actions/finance";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { SalesShipmentManager } from "./_components/sales-shipment-manager";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function SalesOrderDetailsPage({ params }: PageProps) {
    const { id } = await params;

    // Parallel fetching for performance
    const [orderRes, financials, transactions] = await Promise.all([
        getSalesOrder(id),
        getSalesOrderFinancials(id),
        getSalesOrderTransactions(id)
    ]);

    const order = orderRes.data;

    if (orderRes.error || !order) {
        notFound();
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex flex-col gap-4">
                <Link href="/sales-orders">
                    <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground w-fit">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Orders
                    </Button>
                </Link>
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Order {order.id.slice(0, 8)}</h2>
                        <p className="text-sm text-muted-foreground mt-1">{order.client.name} - {order.opportunity.productName}</p>
                    </div>
                </div>
            </div>


            <Separator className="my-4" />

            <Suspense fallback={<div>Loading shipments...</div>}>
                <SalesShipmentManager
                    orderId={order.id}
                    orderStatus={order.status}
                    shipments={(order.shipments || []).map(s => ({
                        ...s,
                        quantity: s.quantity ? Number(s.quantity) : null
                    }))}
                    invoiceCount={order.invoices.length}
                />
            </Suspense>

            <Suspense fallback={<div>Loading details...</div>}>
                <SalesOrderDetailsClient
                    order={order}
                    financials={financials}
                    transactions={transactions}
                />
            </Suspense>
        </div >
    );
}
