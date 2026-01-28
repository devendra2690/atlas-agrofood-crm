import { CreatePurchaseOrderDialog } from "../../purchase-orders/_components/create-po-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building, MapPin, Phone, TestTube, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { RequestSampleDialog } from "./request-sample-dialog";

interface VendorListProps {
    projectVendors: any[];
    samples?: any[];
    isFulfillment?: boolean;
}

export function VendorList({ projectVendors, samples = [], isFulfillment = false }: VendorListProps) {
    if (projectVendors.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                No vendors added yet. Add a vendor to start sourcing.
            </div>
        );
    }

    return (
        <ul className="space-y-4">
            {projectVendors.map((pv) => {
                const vendor = pv.vendor;
                // Check if there is an existing sample for this vendor in this project
                // OR if there is an approved sample for this vendor linked to the Opportunity (if we had that context here, but we rely on passed samples or projectVendors logic)
                // Actually, for Fulfillment, we rely on `samples` prop which should contain relevant samples.

                const existingSample = samples.find(s => s.vendorId === vendor.id);

                return (
                    <li key={pv.id} className="border p-4 rounded-lg flex items-center justify-between">
                        <div className="flex items-start gap-3">
                            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center mt-1">
                                <Building className="h-5 w-5 text-slate-500" />
                            </div>
                            <div>
                                <Link
                                    href={`/vendors/${vendor.id}`}
                                    className="font-medium hover:underline text-blue-600 block"
                                >
                                    {vendor.name}
                                </Link>
                                <div className="text-sm text-muted-foreground flex items-center gap-3 mt-1">
                                    {vendor.city && (
                                        <span className="flex items-center gap-1">
                                            <MapPin className="h-3 w-3" />
                                            {vendor.city?.name || 'N/A'}, {vendor.country?.name || 'N/A'}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {existingSample && (
                                <div className="flex flex-col items-end gap-1 mr-2">
                                    <Badge
                                        variant="outline"
                                        className={`flex items-center gap-1 border-blue-200 text-blue-700 bg-blue-50 ${existingSample.status === 'CLIENT_APPROVED' || existingSample.status === 'Result_APPROVED_INTERNAL' ? 'border-green-200 text-green-700 bg-green-50' : ''}`}
                                    >
                                        <TestTube className="h-3 w-3" />
                                        {existingSample.status === 'CLIENT_APPROVED' ? 'Approved' : existingSample.status}
                                    </Badge>
                                </div>
                            )}

                            {/* Always allow PO creation for listed vendors, especially for Fulfillment */}
                            {isFulfillment && (
                                <CreatePurchaseOrderDialog
                                    defaultProjectId={pv.projectId}
                                    defaultVendorId={vendor.id}
                                    trigger={
                                        <Button size="sm" variant="outline" className="gap-2">
                                            <ShoppingCart className="h-4 w-4" />
                                            Order
                                        </Button>
                                    }
                                />
                            )}

                            {!existingSample && !isFulfillment && (
                                <RequestSampleDialog
                                    projectId={pv.projectId}
                                    vendorId={vendor.id}
                                    vendorName={vendor.name}
                                />
                            )}
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}
