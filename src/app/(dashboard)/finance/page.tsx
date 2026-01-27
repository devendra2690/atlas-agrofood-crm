import { Suspense } from "react";
import { getFinancialStats, getRecentTransactions, getSalesOrdersForSelection, getProfitabilityAnalytics } from "@/app/actions/finance";
import { FinanceDashboard } from "./_components/finance-dashboard";
import { Separator } from "@/components/ui/separator";
import { SalesProfitabilityViewer } from "./_components/sales-profitability-viewer";
import { ProfitabilityWaterfall } from "./_components/profitability-waterfall";
import { MarginTable } from "./_components/margin-table";
import { ExportButton } from "./_components/export-button";

export default async function FinancePage() {
    const stats = await getFinancialStats();
    const transactions = await getRecentTransactions();
    const salesOrders = await getSalesOrdersForSelection();

    // Fetch detailed analytics
    const analytics = await getProfitabilityAnalytics();

    // Prepare export data (flattened for CSV)
    const exportData = analytics.byCustomer.map(c => ({
        Type: 'Customer',
        Name: c.name,
        Revenue: c.revenue,
        Costs: c.costs,
        Margin: c.margin,
        MarginPercent: c.revenue ? (c.margin / c.revenue * 100).toFixed(2) : '0'
    }));

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Financial Dashboard</h2>
                <div className="flex items-center space-x-2">
                    <ExportButton data={exportData} filename="margin-report.csv" />
                </div>
            </div>
            <Separator />
            <Suspense fallback={<div>Loading financial data...</div>}>
                <div className="space-y-8">
                    <FinanceDashboard stats={stats} transactions={transactions} />

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                        <ProfitabilityWaterfall data={analytics.waterfall} />
                        <MarginTable byCustomer={analytics.byCustomer} byProduct={analytics.byProduct} />
                    </div>

                    <Separator />
                    <SalesProfitabilityViewer salesOrders={salesOrders} />
                </div>
            </Suspense>
        </div>
    );
}
