import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { SalesView } from "./_components/sales-view";
import { ProcurementView } from "./_components/procurement-view";

export default async function MatrixPage() {
    const session = await auth();
    if (!session?.user) redirect("/auth/signin");

    const role = session.user.role;

    return (
        <div className="h-full flex flex-col space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Vendor & Commodity Matrix</h1>
                    <p className="text-muted-foreground">
                        {role === "SALES"
                            ? "Search for commodities, varieties, and check origin availability."
                            : "Manage vendor capabilities and process sourcing requests."}
                    </p>
                </div>
            </div>

            <div className="flex-1">
                {role === "SALES" ? <SalesView /> : <ProcurementView />}
            </div>
        </div>
    );
}
