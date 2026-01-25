import { getVendors } from "@/app/actions/company";
import { VendorTable } from "./_components/vendor-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CompanyDialog } from "../companies/_components/company-dialog";

export default async function VendorsPage() {
    const { data: vendors } = await getVendors();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Vendors</h2>
                    <p className="text-muted-foreground">
                        Manage your suppliers and procurement partners.
                    </p>
                </div>
                <CompanyDialog
                    defaultType="VENDOR"
                    trigger={
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Vendor
                        </Button>
                    }
                />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Vendors</CardTitle>
                    <CardDescription>
                        List of companies marked as VENDOR.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <VendorTable vendors={vendors || []} />
                </CardContent>
            </Card>
        </div>
    );
}
