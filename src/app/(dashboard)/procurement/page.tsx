import { getProcurementProjects } from "@/app/actions/procurement";
import { getCommodities } from "@/app/actions/commodity";
import { ProcurementList } from "./_components/procurement-list";
import { ProcurementDialog } from "./_components/procurement-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ProcurementPage() {
    const { data: projects } = await getProcurementProjects();
    const { data: commodities } = await getCommodities();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Procurement</h2>
                    <p className="text-muted-foreground">
                        Manage sourcing projects, vendor samples, and purchase orders.
                    </p>
                </div>
                <ProcurementDialog commodities={commodities || []} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Sourcing Projects</CardTitle>
                    <CardDescription>
                        Active projects for sourcing commodities.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ProcurementList projects={projects || []} commodities={commodities || []} />
                </CardContent>
            </Card>
        </div>
    );
}
