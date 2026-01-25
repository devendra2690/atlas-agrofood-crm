import { Suspense } from "react";
import { getFinancialStats, getRecentTransactions, getSalesOrdersForSelection } from "@/app/actions/finance";
import { FinanceDashboard } from "./_components/finance-dashboard";
import { Separator } from "@/components/ui/separator";
import { SalesProfitabilityViewer } from "./_components/sales-profitability-viewer";

export default async function FinancePage() {
    const stats = await getFinancialStats();
    const transactions = await getRecentTransactions();
    const salesOrders = await getSalesOrdersForSelection();

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Financial Dashboard</h2>
            </div>
            <Separator />
            <Suspense fallback={<div>Loading financial data...</div>}>
                <div className="space-y-8">
                    <FinanceDashboard stats={stats} transactions={transactions} />
                    <Separator />
                    <SalesProfitabilityViewer salesOrders={salesOrders} />
                </div>
            </Suspense>
        </div>
    );
}
