"use client";

import { CreatePurchaseOrderDialog } from "../../purchase-orders/_components/create-po-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building, MapPin, TestTube, ShoppingCart, Trash2, CheckCircle2, AlertCircle, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { RequestSampleDialog } from "./request-sample-dialog";
import { removeVendorFromProject } from "@/app/actions/procurement";
import { toast } from "sonner";
import { useState } from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface CommodityInfo {
    id: string;
    name: string;
    isPrimary?: boolean;
}

interface VendorListProps {
    projectVendors: any[];
    samples?: any[];
    isFulfillment?: boolean;
    project?: any;
    allCommodities?: CommodityInfo[];
    commodityCoverage?: Record<string, number>; // commodityId → count of vendors covering it
}

export function VendorList({
    projectVendors,
    samples = [],
    isFulfillment = false,
    project,
    allCommodities = [],
    commodityCoverage = {}
}: VendorListProps) {
    const [removingId, setRemovingId] = useState<string | null>(null);

    async function handleRemove(pvId: string, projectId: string) {
        try {
            const result = await removeVendorFromProject(pvId, projectId);
            if (result.success) {
                toast.success("Supplier removed from project");
            } else {
                toast.error(result.error || "Failed to remove supplier");
            }
        } catch {
            toast.error("An error occurred");
        } finally {
            setRemovingId(null);
        }
    }

    // Commodity coverage summary — show only if project has named commodities
    const showCoverageSummary = allCommodities.length > 0;
    const uncoveredCommodities = allCommodities.filter(c => (commodityCoverage[c.id] ?? 0) === 0);
    const allCovered = uncoveredCommodities.length === 0;

    return (
        <>
            {/* ── Commodity coverage summary ── */}
            {showCoverageSummary && (
                <div className="mb-4 space-y-2">
                    {/* Overall alert if any commodity has no supplier */}
                    {!allCovered && projectVendors.length > 0 && (
                        <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-amber-500" />
                            <span>
                                <strong>Supplier gap:</strong>{" "}
                                {uncoveredCommodities.map(c => c.name).join(", ")} — no supplier added yet for{" "}
                                {uncoveredCommodities.length === 1 ? "this commodity" : "these commodities"}.
                            </span>
                        </div>
                    )}

                    {/* Per-commodity pill row */}
                    <div className="flex flex-wrap gap-2">
                        {allCommodities.map(c => {
                            const count = commodityCoverage[c.id] ?? 0;
                            const covered = count > 0;
                            return (
                                <div
                                    key={c.id}
                                    className={cn(
                                        "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                                        covered
                                            ? "bg-green-50 border-green-200 text-green-700"
                                            : "bg-red-50 border-red-200 text-red-700"
                                    )}
                                >
                                    {covered
                                        ? <CheckCircle2 className="h-3 w-3 shrink-0" />
                                        : <AlertCircle className="h-3 w-3 shrink-0" />
                                    }
                                    <span>{c.name}</span>
                                    {c.isPrimary && (
                                        <span className="opacity-60 text-[10px]">Primary</span>
                                    )}
                                    <span className={cn(
                                        "ml-0.5 px-1.5 py-0.5 rounded-full text-[10px]",
                                        covered ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                    )}>
                                        {count} supplier{count !== 1 ? "s" : ""}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Warning if no vendors at all */}
                    {projectVendors.length === 0 && (
                        <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-red-500" />
                            <span>
                                No suppliers shortlisted yet for any of the{" "}
                                {allCommodities.length} commodit{allCommodities.length === 1 ? "y" : "ies"}. Use &ldquo;Add Supplier&rdquo; to get started.
                            </span>
                        </div>
                    )}

                    {showCoverageSummary && projectVendors.length > 0 && (
                        <div className="border-t pt-3" />
                    )}
                </div>
            )}

            {/* ── Vendor list ── */}
            {projectVendors.length === 0 && !showCoverageSummary && (
                <div className="text-center py-8 text-muted-foreground">
                    No suppliers added yet. Add a supplier to start sourcing.
                </div>
            )}

            {projectVendors.length > 0 && (
                <ul className="space-y-4">
                    {projectVendors.map((pv) => {
                        const vendor = pv.vendor;
                        const vendorSamples = samples.filter(s => s.vendorId === vendor.id);
                        const approvedSamples = vendorSamples.filter(s => s.status === 'CLIENT_APPROVED' || s.status === 'Result_APPROVED_INTERNAL');
                        const canRemove = vendorSamples.length === 0;

                        // Which project commodities does this vendor supply?
                        const vendorProjectCommodities = allCommodities.filter(c =>
                            (vendor.commodities || []).some((vc: any) => vc.id === c.id)
                        );

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
                                        {/* Commodity tags for this vendor */}
                                        {vendorProjectCommodities.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-1.5">
                                                {vendorProjectCommodities.map(c => (
                                                    <Badge
                                                        key={c.id}
                                                        variant="secondary"
                                                        className="text-[10px] py-0 px-1.5 bg-blue-50 text-blue-700 border-blue-100"
                                                    >
                                                        {c.name}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {isFulfillment ? (
                                        approvedSamples.length > 0 ? (
                                            <div className="flex flex-col gap-2 items-end">
                                                {approvedSamples.map(sample => {
                                                    const commodityName = sample.opportunityItem?.productName || sample.opportunityItem?.commodity?.name || sample.project?.commodity?.name || 'Item';
                                                    const commodityId = sample.opportunityItem?.commodityId || sample.project?.commodityId;

                                                    let isFulfilled = false;
                                                    if (project && project.salesOpportunities && commodityId) {
                                                        const itemDemand = project.salesOpportunities
                                                            .filter((opp: any) => opp.status === 'OPEN' || opp.status === 'CLOSED_WON')
                                                            .reduce((sum: number, opp: any) => {
                                                                const itemsTotal = (opp.items || [])
                                                                    .filter((item: any) => sample.opportunityItemId ? item.id === sample.opportunityItemId : item.commodityId === commodityId)
                                                                    .reduce((itemSum: number, item: any) => {
                                                                        const isVendorSupply = sample?.vendor?.type === 'VENDOR';
                                                                        const demandValue = isVendorSupply
                                                                            ? (Number(item.procurementQuantity) || Number(item.quantity) || 0)
                                                                            : (Number(item.quantity) || 0);
                                                                        return itemSum + demandValue;
                                                                    }, 0);
                                                                return sum + itemsTotal;
                                                            }, 0);

                                                        const itemProcured = (project.purchaseOrders || [])
                                                            .filter((po: any) => po.status !== 'CANCELLED')
                                                            .reduce((sum: number, po: any) => {
                                                                if (po.items && po.items.length > 0) {
                                                                    const matchedItems = po.items.filter((it: any) => {
                                                                        if (sample.opportunityItemId && it.opportunityItemId) return it.opportunityItemId === sample.opportunityItemId;
                                                                        return it.commodityId === commodityId;
                                                                    });
                                                                    if (matchedItems.length > 0) {
                                                                        return sum + matchedItems.reduce((matchSum: number, it: any) => matchSum + (Number(it.quantity) || 0), 0);
                                                                    }
                                                                    return sum;
                                                                }
                                                                const poItemId = po.sample?.submissions?.[0]?.opportunityItemId;
                                                                if (sample.opportunityItemId && poItemId) return sum + (poItemId === sample.opportunityItemId ? (Number(po.quantity) || 0) : 0);
                                                                if (po.sample?.project?.commodityId === commodityId) return sum + (Number(po.quantity) || 0);
                                                                return sum;
                                                            }, 0);

                                                        isFulfilled = itemDemand > 0 && Math.round(itemProcured * 1000) >= Math.round(itemDemand * 1000);
                                                    }

                                                    return (
                                                        <div key={sample.id} className="flex items-center gap-2 justify-end">
                                                            <span className="text-sm font-medium text-slate-700">{commodityName}</span>
                                                            <Badge variant="outline" className="flex items-center gap-1 border-green-200 text-green-700 bg-green-50">
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
                                                })}
                                            </div>
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

                                    {/* Remove button — only when no samples exist */}
                                    {canRemove && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                                            title="Remove supplier"
                                            onClick={() => setRemovingId(pv.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}

            {/* Confirm removal dialog */}
            <AlertDialog open={!!removingId} onOpenChange={open => !open && setRemovingId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove Supplier?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This supplier will be removed from the project. You can add them again later.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive hover:bg-destructive/90"
                            onClick={() => {
                                if (!removingId) return;
                                const pv = projectVendors.find(p => p.id === removingId);
                                if (pv) handleRemove(pv.id, pv.projectId);
                            }}
                        >
                            Remove
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
