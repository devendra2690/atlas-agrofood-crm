"use client";

import { useState } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSalesOrderFinancials, getSalesOrderTransactions } from "@/app/actions/finance";
import { SalesOrderFinancials } from "../../sales-orders/[id]/_components/sales-order-financials";

interface SalesProfitabilityViewerProps {
    salesOrders: { id: string; client: { name: string }; opportunity: { productName: string } }[];
}

export function SalesProfitabilityViewer({ salesOrders }: SalesProfitabilityViewerProps) {
    const [selectedOrderId, setSelectedOrderId] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<{ financials: any, transactions: any[] } | null>(null);

    const handleOrderChange = async (orderId: string) => {
        setSelectedOrderId(orderId);
        setLoading(true);
        try {
            const [financials, transactions] = await Promise.all([
                getSalesOrderFinancials(orderId),
                getSalesOrderTransactions(orderId)
            ]);
            setData({ financials, transactions });
        } catch (error) {
            console.error("Failed to fetch order financials", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="col-span-1 md:col-span-2 lg:col-span-3">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xl font-bold">Per-Sale Profitability</CardTitle>
                <div className="w-[300px]">
                    <Select value={selectedOrderId} onValueChange={handleOrderChange}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a Sales Order..." />
                        </SelectTrigger>
                        <SelectContent>
                            {salesOrders.map((order) => (
                                <SelectItem key={order.id} value={order.id}>
                                    {order.client.name} - {order.opportunity.productName} ({order.id.slice(0, 8)})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent>
                {!selectedOrderId ? (
                    <div className="flex h-[200px] items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
                        Select a sales order to view detailed profitability
                    </div>
                ) : loading ? (
                    <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                        Loading financial data...
                    </div>
                ) : data ? (
                    <div className="mt-4">
                        <SalesOrderFinancials
                            salesOrderId={selectedOrderId}
                            financials={data.financials}
                            transactions={data.transactions}
                        />
                    </div>
                ) : null}
            </CardContent>
        </Card>
    );
}
