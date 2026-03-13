"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { updateSampleStatus } from "@/app/actions/sample";
import { UpdateSampleDialog } from "./update-sample-dialog";
import { SampleImageDialog } from "./sample-image-dialog";
import { format } from "date-fns";
import { TestTube, CheckCircle, Truck, Package, FolderOpen, AlertCircle, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import Link from "next/link";

import { SampleShipmentDialog } from "./sample-shipment-dialog";
import { ShipmentDocumentAttachment } from "../../logistics/_components/shipment-document-attachment";

interface SampleListProps {
    samples: any[];
}

// Status groupings
const ACTION_REQUIRED_STATUSES = ['RECEIVED'];
const REQUESTED_STATUSES = ['REQUESTED'];
const IN_TRANSIT_STATUSES = ['SENT'];
const COMPLETED_STATUSES = [
    'Result_APPROVED_INTERNAL',
    'SENT_TO_CLIENT',
    'CLIENT_APPROVED',
    'CLIENT_REJECTED',
    'Result_REJECTED',
    'UNDER_REVIEW',
];

function getStatusLabel(status: string): string {
    if (['Result_APPROVED_INTERNAL', 'SENT_TO_CLIENT', 'CLIENT_APPROVED'].includes(status)) return 'APPROVED';
    if (['Result_REJECTED', 'CLIENT_REJECTED'].includes(status)) return 'REJECTED';
    return status.replace('Result_', '').replace(/_/g, ' ');
}

function getStatusBadgeVariant(status: string): 'default' | 'destructive' | 'secondary' | 'outline' {
    if (['Result_APPROVED_INTERNAL', 'SENT_TO_CLIENT', 'CLIENT_APPROVED'].includes(status)) return 'default';
    if (status.includes('REJECTED')) return 'destructive';
    if (status === 'RECEIVED') return 'secondary';
    return 'outline';
}

export function SampleList({ samples }: SampleListProps) {
    const [loadingId, setLoadingId] = useState<string | null>(null);

    async function handleStatusUpdate(id: string, status: any) {
        setLoadingId(id);
        try {
            const result = await updateSampleStatus(id, status);
            if (result.success) {
                toast.success(`Sample status updated to ${status}`);
            } else {
                toast.error("Failed to update status");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred");
        } finally {
            setLoadingId(null);
        }
    }

    if (samples.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <TestTube className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                <p>No samples found. Request samples from the Procurement section.</p>
            </div>
        );
    }

    const actionRequired = samples.filter(s => ACTION_REQUIRED_STATUSES.includes(s.status) && s.project?.status !== 'CANCELLED');
    const requested = samples.filter(s => REQUESTED_STATUSES.includes(s.status) && s.project?.status !== 'CANCELLED');
    const inTransit = samples.filter(s => IN_TRANSIT_STATUSES.includes(s.status) && s.project?.status !== 'CANCELLED');
    const completed = samples.filter(s => COMPLETED_STATUSES.includes(s.status) && s.project?.status !== 'CANCELLED');
    const cancelled = samples.filter(s => s.project?.status === 'CANCELLED');

    const defaultTab = actionRequired.length > 0 ? "action"
        : requested.length > 0 ? "requested"
        : inTransit.length > 0 ? "transit"
        : "completed";

    return (
        <Tabs defaultValue={defaultTab}>
            <TabsList className="mb-6">
                <TabsTrigger value="action" className="gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Action Required
                    {actionRequired.length > 0 && (
                        <Badge className="ml-1 h-5 min-w-5 px-1.5 text-xs bg-amber-500 hover:bg-amber-500 text-white">
                            {actionRequired.length}
                        </Badge>
                    )}
                </TabsTrigger>
                <TabsTrigger value="requested" className="gap-2">
                    <Clock className="h-4 w-4" />
                    Requested
                    {requested.length > 0 && (
                        <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5 text-xs">
                            {requested.length}
                        </Badge>
                    )}
                </TabsTrigger>
                <TabsTrigger value="transit" className="gap-2">
                    <Truck className="h-4 w-4" />
                    In Transit
                    {inTransit.length > 0 && (
                        <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5 text-xs">
                            {inTransit.length}
                        </Badge>
                    )}
                </TabsTrigger>
                <TabsTrigger value="completed" className="gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Completed
                    {completed.length > 0 && (
                        <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5 text-xs">
                            {completed.length}
                        </Badge>
                    )}
                </TabsTrigger>
                <TabsTrigger value="cancelled" className="gap-2 text-muted-foreground">
                    <XCircle className="h-4 w-4" />
                    Cancelled
                    {cancelled.length > 0 && (
                        <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5 text-xs">
                            {cancelled.length}
                        </Badge>
                    )}
                </TabsTrigger>
            </TabsList>

            <TabsContent value="action">
                <SampleTabContent
                    samples={actionRequired}
                    emptyMessage="No samples awaiting review."
                    onStatusUpdate={handleStatusUpdate}
                    loadingId={loadingId}
                />
            </TabsContent>

            <TabsContent value="requested">
                <SampleTabContent
                    samples={requested}
                    emptyMessage="No pending sample requests."
                    onStatusUpdate={handleStatusUpdate}
                    loadingId={loadingId}
                />
            </TabsContent>

            <TabsContent value="transit">
                <SampleTabContent
                    samples={inTransit}
                    emptyMessage="No samples currently in transit."
                    onStatusUpdate={handleStatusUpdate}
                    loadingId={loadingId}
                />
            </TabsContent>

            <TabsContent value="completed">
                <SampleTabContent
                    samples={completed}
                    emptyMessage="No completed samples yet."
                    onStatusUpdate={handleStatusUpdate}
                    loadingId={loadingId}
                    dimmed
                />
            </TabsContent>

            <TabsContent value="cancelled">
                <SampleTabContent
                    samples={cancelled}
                    emptyMessage="No cancelled samples."
                    onStatusUpdate={handleStatusUpdate}
                    loadingId={loadingId}
                    dimmed
                />
            </TabsContent>
        </Tabs>
    );
}

// ─── Tab Content ─────────────────────────────────────────────────────────────

function SampleTabContent({
    samples,
    emptyMessage,
    onStatusUpdate,
    loadingId,
    dimmed = false,
}: {
    samples: any[];
    emptyMessage: string;
    onStatusUpdate: (id: string, status: any) => void;
    loadingId: string | null;
    dimmed?: boolean;
}) {
    if (samples.length === 0) {
        return (
            <div className="text-center py-10 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                {emptyMessage}
            </div>
        );
    }

    return (
        <ul className="space-y-3">
            {samples.map(sample => (
                <SampleCard
                    key={sample.id}
                    sample={sample}
                    onStatusUpdate={onStatusUpdate}
                    loadingId={loadingId}
                    dimmed={dimmed}
                />
            ))}
        </ul>
    );
}

// ─── Individual Sample Card ───────────────────────────────────────────────────

function SampleCard({
    sample,
    onStatusUpdate,
    loadingId,
    dimmed,
}: {
    sample: any;
    onStatusUpdate: (id: string, status: any) => void;
    loadingId: string | null;
    dimmed: boolean;
}) {
    const commodityName = sample.project?.commodity?.name;
    const projectName = sample.project?.name;
    const projectId = sample.project?.id;

    return (
        <li className={`border rounded-lg bg-white overflow-hidden transition-opacity ${dimmed ? 'opacity-70 hover:opacity-100' : ''}`}>
            <div className="flex items-start gap-4 p-4">
                {/* Image / Placeholder */}
                <div className="shrink-0">
                    {sample.images && sample.images.length > 0 ? (
                        <SampleImageDialog
                            images={sample.images}
                            trigger={
                                <div className="relative group cursor-pointer">
                                    <img
                                        src={sample.images[0]}
                                        alt="Sample"
                                        className="h-16 w-16 rounded-md object-cover border shadow-sm group-hover:opacity-90"
                                    />
                                    {sample.images.length > 1 && (
                                        <div className="absolute bottom-0 right-0 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-tl-md">
                                            +{sample.images.length - 1}
                                        </div>
                                    )}
                                </div>
                            }
                        />
                    ) : (
                        <div className="h-16 w-16 rounded-md bg-slate-100 flex items-center justify-center border text-slate-400">
                            <TestTube className="h-6 w-6 text-slate-300" />
                        </div>
                    )}
                </div>

                {/* Main Content */}
                <div className="flex-1 min-w-0">
                    {/* Vendor + Price */}
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-semibold text-base">{sample.vendor?.name || "Unknown Vendor"}</span>
                        {sample.priceQuoted && (
                            <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-0">
                                ₹{Number(sample.priceQuoted).toFixed(2)} / {sample.priceUnit?.replace("PER_", "").toLowerCase() || "kg"}
                            </Badge>
                        )}
                    </div>

                    {/* ── NEW: Commodity + Project ── */}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2 flex-wrap">
                        {commodityName && (
                            <span className="flex items-center gap-1">
                                <Package className="h-3 w-3 shrink-0" />
                                {commodityName}
                            </span>
                        )}
                        {projectName && projectId && (
                            <Link
                                href={`/procurement/${projectId}`}
                                className="flex items-center gap-1 text-blue-600 hover:underline"
                                onClick={e => e.stopPropagation()}
                            >
                                <FolderOpen className="h-3 w-3 shrink-0" />
                                {projectName}
                            </Link>
                        )}
                    </div>

                    {/* Date / Status text */}
                    <div className="text-xs text-muted-foreground">
                        {sample.receivedDate
                            ? `Received on ${format(new Date(sample.receivedDate), "PP")}`
                            : `Status: ${sample.status.replace('Result_', '').replace(/_/g, ' ')}`}
                    </div>

                    {/* Notes */}
                    <div className="space-y-0.5 mt-1.5">
                        {sample.notes && (
                            <div className="text-xs text-slate-500 italic">Request: "{sample.notes}"</div>
                        )}
                        {sample.qualityNotes && (
                            <div className="text-xs text-blue-600">
                                <span className="font-semibold">Inspection:</span> {sample.qualityNotes}
                            </div>
                        )}
                        {sample.feedback && (
                            <div className="text-xs text-orange-600">
                                <span className="font-semibold">Feedback:</span> {sample.feedback}
                            </div>
                        )}
                    </div>

                    {/* Shipment courier box */}
                    {sample.shipments && sample.shipments.length > 0 && (
                        <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-md max-w-lg">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start justify-between">
                                <div>
                                    <div className="text-sm font-semibold flex items-center gap-1.5 text-slate-700">
                                        <Truck className="h-4 w-4 text-blue-600" /> Courier Details
                                    </div>
                                    <div className="text-xs text-slate-600 mt-1.5 space-y-0.5">
                                        <div><span className="font-medium text-slate-800">Carrier:</span> {sample.shipments[0].carrier}</div>
                                        {sample.shipments[0].trackingNumber && (
                                            <div><span className="font-medium text-slate-800">Tracking (AWB):</span> {sample.shipments[0].trackingNumber}</div>
                                        )}
                                        {sample.shipments[0].eta && (
                                            <div><span className="font-medium text-slate-800">ETA:</span> {format(new Date(sample.shipments[0].eta), "PP")}</div>
                                        )}
                                        {sample.shipments[0].notes && (
                                            <div className="italic mt-1">"{sample.shipments[0].notes}"</div>
                                        )}
                                    </div>
                                </div>
                                <div className="mt-2 sm:mt-0 min-w-[200px]">
                                    <ShipmentDocumentAttachment
                                        shipmentId={sample.shipments[0].id}
                                        documents={sample.shipments[0].documents || []}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right-side Actions */}
                <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                    <Badge
                        variant={getStatusBadgeVariant(sample.status)}
                        className={
                            ['Result_APPROVED_INTERNAL', 'SENT_TO_CLIENT', 'CLIENT_APPROVED'].includes(sample.status)
                                ? "bg-green-600 hover:bg-green-700 text-white"
                                : ""
                        }
                    >
                        {getStatusLabel(sample.status)}
                    </Badge>

                    <UpdateSampleDialog sample={sample} />

                    {sample.status === 'REQUESTED' && (
                        <SampleShipmentDialog sampleId={sample.id} />
                    )}

                    {sample.status === 'SENT' && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onStatusUpdate(sample.id, 'RECEIVED')}
                            disabled={loadingId === sample.id}
                        >
                            {loadingId === sample.id
                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                : <CheckCircle className="h-4 w-4 mr-2" />}
                            Mark Received
                        </Button>
                    )}

                    {sample.status === 'RECEIVED' && (
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant="default"
                                className="bg-slate-800 hover:bg-slate-900"
                                onClick={() => onStatusUpdate(sample.id, 'Result_APPROVED_INTERNAL')}
                                disabled={loadingId === sample.id}
                            >
                                {loadingId === sample.id ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                                Internal Approve
                            </Button>
                            <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => onStatusUpdate(sample.id, 'Result_REJECTED')}
                                disabled={loadingId === sample.id}
                            >
                                Reject
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </li>
    );
}
