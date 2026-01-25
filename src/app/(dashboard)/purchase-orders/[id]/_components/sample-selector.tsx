"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Star } from "lucide-react";
import { setPurchaseOrderSample } from "@/app/actions/procurement";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface SampleSelectorProps {
    poId: string;
    activeSampleId?: string | null;
    candidateSamples: any[];
}

export function SampleSelector({ poId, activeSampleId, candidateSamples }: SampleSelectorProps) {
    const [loadingId, setLoadingId] = useState<string | null>(null);

    async function handleSelect(sampleId: string) {
        setLoadingId(sampleId);
        const res = await setPurchaseOrderSample(poId, sampleId);
        if (res.success) {
            toast.success("Linked sample updated");
        } else {
            toast.error("Failed to update linked sample");
        }
        setLoadingId(null);
    }

    if (candidateSamples.length === 0) return null;

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Client Approved Candidates</h3>
            <div className="grid gap-4 md:grid-cols-2">
                {candidateSamples.map((sample) => {
                    const isActive = sample.id === activeSampleId;
                    return (
                        <Card key={sample.id} className={cn("transition-all", isActive ? "border-green-500 bg-green-50/20 shadow-md ring-1 ring-green-500" : "hover:border-slate-300")}>
                            <CardContent className="p-4 flex gap-4">
                                <div className="h-20 w-20 shrink-0 bg-slate-100 rounded-md overflow-hidden relative">
                                    {sample.images?.[0] ? (
                                        <img src={sample.images[0]} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">No Img</div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-medium truncate">{sample.vendor?.name}</p>

                                            <div className="text-xs text-slate-500 mb-2 flex flex-col">
                                                <span className="flex items-center gap-1">
                                                    📞 {sample.vendor?.phone || "No Phone"}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    📍 {sample.vendor?.city}, {sample.vendor?.state}, {sample.vendor?.country}
                                                </span>
                                            </div>

                                            <p className="text-sm text-slate-900 font-medium">Quoted: ₹{sample.priceQuoted}</p>
                                        </div>
                                        {isActive && <BadgeActive />}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1 line-clamp-2" title={sample.qualityNotes}>{sample.qualityNotes || "No notes"}</p>

                                    <div className="mt-3">
                                        {!isActive ? (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="w-full h-8 text-xs"
                                                onClick={() => handleSelect(sample.id)}
                                                disabled={!!loadingId}
                                            >
                                                {loadingId === sample.id ? "Linking..." : "Use this Sample"}
                                            </Button>
                                        ) : (
                                            <div className="flex items-center text-green-600 text-xs font-medium h-8">
                                                <Check className="w-3 h-3 mr-1" /> Active Linked Sample
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}

function BadgeActive() {
    return (
        <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
            Selected
        </span>
    );
}
