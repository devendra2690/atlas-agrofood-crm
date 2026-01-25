import { getDashboardStats } from "@/app/actions/dashboard";
import {
    SalesSummaryCard,
    ProcurementSummaryCard,
    LogisticsSummaryCard,
    FinanceSummaryCard
} from "./_components/department-cards";

export default async function DashboardPage() {
    const { success, data } = await getDashboardStats();

    if (!success || !data) {
        return (
            <div className="p-8 text-center text-muted-foreground">
                Failed to load dashboard data.
            </div>
        );
    }

    return (
        <div className="space-y-8 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Executive Dashboard</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <SalesSummaryCard stats={data.sales} />
                <ProcurementSummaryCard stats={data.procurement} />
                <LogisticsSummaryCard stats={data.logistics} />
                <FinanceSummaryCard stats={data.finance} />
            </div>

            {/* Placeholder for future detailed widgets */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* We can add a recent activity feed or charts here later */}
            </div>
        </div>
    );
}
