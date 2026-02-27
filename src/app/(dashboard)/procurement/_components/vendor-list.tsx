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
    project?: any; // Add project prop
}

export function VendorList({ projectVendors, samples = [], isFulfillment = false, project }: VendorListProps) {
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

                const vendorSamples = samples.filter(s => s.vendorId === vendor.id);
                const approvedSamples = vendorSamples.filter(s => s.status === 'CLIENT_APPROVED' || s.status === 'Result_APPROVED_INTERNAL');

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
                        <div className="flex flex-col gap-2">
                            {isFulfillment ? (
                                approvedSamples.length > 0 ? (
                                    approvedSamples.map(sample => {
                                        const commodityName = sample.opportunityItem?.productName || sample.opportunityItem?.commodity?.name || sample.project?.commodity?.name || 'Item';
                                        const commodityId = sample.opportunityItem?.commodityId || sample.project?.commodityId;

                                        let isFulfilled = false;
                                        if (project && project.salesOpportunities && commodityId) {
                                            const itemDemand = project.salesOpportunities
                                                .filter((opp: any) => opp.status === 'OPEN' || opp.status === 'CLOSED_WON')
                                                .reduce((sum: number, opp: any) => {
                                                    const itemsTotal = (opp.items || [])
                                                        .filter((item: any) => sample.opportunityItemId ? item.id === sample.opportunityItemId : item.commodityId === commodityId)
                                                        .reduce((itemSum: number, item: any) => itemSum + (Number(item.procurementQuantity) || Number(item.quantity) || 0), 0);
                                                    return sum + itemsTotal;
                                                }, 0);

                                            const itemProcured = (project.purchaseOrders || [])
                                                .filter((po: any) => {
                                                    if (po.status === 'CANCELLED') return false;
                                                    const poItemId = po.sample?.submissions?.[0]?.opportunityItemId;
                                                    if (sample.opportunityItemId && poItemId) return poItemId === sample.opportunityItemId;
                                                    return po.sample?.project?.commodityId === commodityId;
                                                })
                                                .reduce((sum: number, po: any) => sum + (Number(po.quantity) || 0), 0);

                                            isFulfilled = itemDemand > 0 && itemProcured >= itemDemand;
                                        }

                                        return (
                                            <div key={sample.id} className="flex items-center gap-2 justify-end">
                                                <span className="text-sm font-medium text-slate-700">{commodityName}</span>
                                                <Badge
                                                    variant="outline"
                                                    className="flex items-center gap-1 border-green-200 text-green-700 bg-green-50"
                                                >
                                                    <TestTube className="h-3 w-3" />
                                                    Approved
                                                </Badge>
                                                <CreatePurchaseOrderDialog
                                                    defaultProjectId={pv.projectId}
                                                    defaultVendorId={vendor.id}
                                                    defaultCommodityName={commodityName}
                                                    defaultSampleId={sample.id}
                                                    trigger={
                                                        <Button size="sm" variant="outline" className="gap-2 shrink-0" disabled={isFulfilled}>
                                                            <ShoppingCart className="h-4 w-4" />
                                                            {isFulfilled ? "Fulfilled" : "Order"}
                                                        </Button>
                                                    }
                                                />
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="text-sm text-muted-foreground mr-2 text-right">No approved items</div>
                                )
                            ) : (
                                <div className="flex items-center gap-2 justify-end">
                                    {vendorSamples.length > 0 && (
                                        <div className="flex flex-col items-end gap-1 mr-2">
                                            <Badge
                                                variant="outline"
                                                className={`flex items-center gap-1 border-blue-200 text-blue-700 bg-blue-50 ${vendorSamples[0].status === 'CLIENT_APPROVED' || vendorSamples[0].status === 'Result_APPROVED_INTERNAL' ? 'border-green-200 text-green-700 bg-green-50' : ''}`}
                                            >
                                                <TestTube className="h-3 w-3" />
                                                {vendorSamples[0].status === 'CLIENT_APPROVED' ? 'Approved' : vendorSamples[0].status}
                                            </Badge>
                                        </div>
                                    )}
                                    {!vendorSamples.length && (
                                        <RequestSampleDialog
                                            projectId={pv.projectId}
                                            vendorId={vendor.id}
                                            vendorName={vendor.name}
                                        />
                                    )}
                                </div>
                            )}
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}
