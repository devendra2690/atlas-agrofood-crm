import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building, MapPin, Phone, TestTube } from "lucide-react";
import Link from "next/link";
import { RequestSampleDialog } from "./request-sample-dialog";

interface VendorListProps {
    projectVendors: any[];
    samples?: any[];
}

export function VendorList({ projectVendors, samples = [] }: VendorListProps) {
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
                                    {vendor.phone && (
                                        <span className="flex items-center gap-1">
                                            <Phone className="h-3 w-3" />
                                            {vendor.phone}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div>
                            {existingSample ? (
                                <div className="flex flex-col items-end gap-1">
                                    <Badge variant="outline" className="flex items-center gap-1 border-blue-200 text-blue-700 bg-blue-50">
                                        <TestTube className="h-3 w-3" />
                                        Sample Requested
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                        {existingSample.status}
                                    </span>
                                </div>
                            ) : (
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
