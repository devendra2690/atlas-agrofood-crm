"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { sendSampleToClient } from "@/app/actions/sample";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface SendSampleSheetProps {
    sampleId: string;
    opportunities: any[]; // SalesOpportunity with Company
    trigger: React.ReactNode;
}

export function SendSampleSheet({ sampleId, opportunities, trigger }: SendSampleSheetProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedOppId, setSelectedOppId] = useState<string | null>(null);

    async function handleSend() {
        if (!selectedOppId) return;

        setLoading(true);
        try {
            const result = await sendSampleToClient(sampleId, selectedOppId);
            if (result.success) {
                toast.success("Sample sent to client!");
                setOpen(false);
            } else {
                toast.error("Failed to send sample");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    }

    // Filter only OPEN opportunities? Usually yes, we don't send validation samples for closed deals unless verified.
    const activeOpps = opportunities.filter(opp => opp.status === 'OPEN' || opp.status === 'CLOSED_WON');

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                {trigger}
            </SheetTrigger>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Send to Client</SheetTitle>
                    <SheetDescription>
                        Select which customer opportunity this sample is being sent to.
                    </SheetDescription>
                </SheetHeader>

                <div className="py-6 space-y-6">
                    {activeOpps.length === 0 ? (
                        <div className="text-center text-muted-foreground py-4 border rounded-md bg-slate-50">
                            No active opportunities linked to this project.
                        </div>
                    ) : (
                        <RadioGroup value={selectedOppId || ""} onValueChange={setSelectedOppId}>
                            {activeOpps.map((opp) => (
                                <div key={opp.id} className="flex items-start space-x-3 space-y-0 rounded-md border p-4 hover:bg-slate-50 cursor-pointer" onClick={() => setSelectedOppId(opp.id)}>
                                    <RadioGroupItem value={opp.id} id={opp.id} className="mt-1" />
                                    <div className="grid gap-1.5 cursor-pointer">
                                        <Label htmlFor={opp.id} className="font-medium cursor-pointer">
                                            {opp.company?.name || "Unknown Company"}
                                            {opp.status === 'CLOSED_WON' && <Badge variant="secondary" className="ml-2 text-[10px]">Won</Badge>}
                                        </Label>
                                        <div className="text-sm text-muted-foreground">
                                            {opp.productName} • {opp.quantity ? `${opp.quantity} MT` : 'No Qty'}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </RadioGroup>
                    )}
                </div>

                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleSend} disabled={loading || !selectedOppId || activeOpps.length === 0}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirm & Send
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
