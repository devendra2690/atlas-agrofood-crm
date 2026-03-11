"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { updateSampleStatus } from "@/app/actions/sample";
import { UpdateSampleDialog } from "./update-sample-dialog";
import { SampleImageDialog } from "./sample-image-dialog";
import { format } from "date-fns";
import { TestTube, CheckCircle, Truck, XCircle, Search } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { Loader2 } from "lucide-react";

import { SendSampleSheet } from "./send-sample-sheet";
import { SampleShipmentDialog } from "./sample-shipment-dialog";
import { ShipmentDocumentAttachment } from "../../logistics/_components/shipment-document-attachment";
// ...
interface SampleListProps {
    samples: any[];
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
            <div className="text-center py-8 text-muted-foreground">
                No samples requested yet. Go to 'Vendors' tab to request a sample.
            </div>
        );
    }

    return (
        <ul className="space-y-4">
            {samples.map((sample) => (
                <li key={sample.id} className="border p-4 rounded-lg flex items-center justify-between bg-white">
                    <div className="flex items-start gap-4">
                        {sample.images && sample.images.length > 0 ? (
                            <SampleImageDialog
                                images={sample.images}
                                trigger={
                                    <div className="relative group cursor-pointer">
                                        <img src={sample.images[0]} alt="Sample" className="h-20 w-20 rounded-md object-cover border shadow-sm group-hover:opacity-90" />
                                        {sample.images.length > 1 && (
                                            <div className="absolute bottom-0 right-0 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-tl-md">
                                                +{sample.images.length - 1}
                                            </div>
                                        )}
                                    </div>
                                }
                            />
                        ) : (
                            <div className="h-20 w-20 rounded-md bg-slate-100 flex items-center justify-center border text-slate-400">
                                <TestTube className="h-8 w-8 text-slate-300" />
                            </div>
                        )}

                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-lg">{sample.vendor?.name || "Unknown Vendor"}</span>
                                {sample.priceQuoted && (
                                    <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-0">
                                        ₹{Number(sample.priceQuoted).toFixed(2)} / {sample.priceUnit?.replace("PER_", "").toLowerCase() || "kg"}
                                    </Badge>
                                )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                {sample.receivedDate ? (
                                    <span>Received on {format(new Date(sample.receivedDate), "PP")}</span>
                                ) : (
                                    <span>Status: {sample.status}</span>
                                )}
                            </div>

                            {/* Notes Section */}
                            <div className="space-y-1 mt-2">
                                {sample.notes && (
                                    <div className="text-xs text-slate-500 italic">
                                        Request: "{sample.notes}"
                                    </div>
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

                            {/* Inbound Shipment Section */}
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
                    </div>
                    <div className="flex items-center gap-3">
                        <Badge variant={
                            ['Result_APPROVED_INTERNAL', 'SENT_TO_CLIENT', 'CLIENT_APPROVED', 'CLIENT_REJECTED'].includes(sample.status) ? 'default' :
                                sample.status.includes('REJECTED') ? 'destructive' :
                                    sample.status === 'RECEIVED' ? 'secondary' : 'outline'
                        } className={['Result_APPROVED_INTERNAL', 'SENT_TO_CLIENT', 'CLIENT_APPROVED', 'CLIENT_REJECTED'].includes(sample.status) ? "bg-green-600 hover:bg-green-700" : ""}>
                            {['Result_APPROVED_INTERNAL', 'SENT_TO_CLIENT', 'CLIENT_APPROVED', 'CLIENT_REJECTED'].includes(sample.status)
                                ? "APPROVED"
                                : sample.status.replace("Result_", "").replace(/_/g, " ")}
                        </Badge>

                        <UpdateSampleDialog sample={sample} />

                        {/* Actions based on Status */}
                        {sample.status === 'REQUESTED' && (
                            <SampleShipmentDialog sampleId={sample.id} />
                        )}

                        {sample.status === 'SENT' && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusUpdate(sample.id, 'RECEIVED')}
                                disabled={loadingId === sample.id}
                            >
                                {loadingId === sample.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                                Mark Received
                            </Button>
                        )}

                        {sample.status === 'RECEIVED' && (
                            <div className="flex gap-2">
                                <Button size="sm" variant="default" className="bg-slate-800 hover:bg-slate-900" onClick={() => handleStatusUpdate(sample.id, 'Result_APPROVED_INTERNAL')}>
                                    Internal Approve
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => handleStatusUpdate(sample.id, 'Result_REJECTED')}>
                                    Reject
                                </Button>
                            </div>
                        )}

                    </div>
                </li>
            ))}
        </ul>
    );
}
