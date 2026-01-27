import { getDashboardStats, getSalesChartData, getRecentActivity, getPendingTasks } from "@/app/actions/dashboard";
import {
    SalesSummaryCard,
    ProcurementSummaryCard,
    LogisticsSummaryCard,
    FinanceSummaryCard
} from "./_components/department-cards";
import { OverviewChart } from "./_components/overview-chart";
import { RecentActivity } from "./_components/recent-activity";
import { RecentTasks } from "./_components/recent-tasks";

export default async function DashboardPage() {
    const { success, data } = await getDashboardStats();

    // Fetch widget data in parallel
    const [salesChartData, recentActivity, pendingTasks] = await Promise.all([
        getSalesChartData(),
        getRecentActivity(),
        getPendingTasks()
    ]);

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

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
                <div className="col-span-1 lg:col-span-4">
                    <OverviewChart data={salesChartData} />
                </div>
                <div className="col-span-1 lg:col-span-3 grid gap-4">
                    <RecentTasks tasks={pendingTasks} />
                    <RecentActivity activities={recentActivity} />
                </div>
            </div>
        </div>
    );
}
