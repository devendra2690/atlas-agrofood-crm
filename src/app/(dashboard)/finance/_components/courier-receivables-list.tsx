"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { CheckCircle, Clock } from "lucide-react";
import { markCourierChargeReceived } from "@/app/actions/finance";
import { useRouter } from "next/navigation";

interface Receivable {
    id: string;
    amount: number;
    date: Date;
    description: string;
    salesOrderId: string | null;
    clientName: string | null;
}

interface CourierReceivablesListProps {
    receivables: Receivable[];
}

export function CourierReceivablesList({ receivables }: CourierReceivablesListProps) {
    const router = useRouter();
    const [loading, setLoading] = useState<string | null>(null);

    async function handleMarkReceived(id: string) {
        setLoading(id);
        const result = await markCourierChargeReceived(id);
        setLoading(null);
        if (result.success) {
            router.refresh();
        }
    }

    return (
        <Card className="border-amber-200">
            <CardHeader className="flex flex-row items-center gap-2 pb-3">
                <Clock className="h-4 w-4 text-amber-600" />
                <CardTitle className="text-base text-amber-800">Courier Receivables</CardTitle>
                <Badge variant="secondary" className="ml-auto bg-amber-100 text-amber-700 border-amber-300">
                    {receivables.length} pending
                </Badge>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {receivables.map((r) => (
                        <div
                            key={r.id}
                            className="flex items-center justify-between rounded-lg border border-amber-100 bg-amber-50/40 px-4 py-3"
                        >
                            <div className="space-y-0.5">
                                <p className="text-sm font-medium">{r.description}</p>
                                <p className="text-xs text-muted-foreground">
                                    {r.clientName && <span className="font-medium">{r.clientName} · </span>}
                                    {format(new Date(r.date), "MMM d, yyyy")}
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="font-semibold text-amber-700">₹{r.amount.toLocaleString()}</span>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                                    disabled={loading === r.id}
                                    onClick={() => handleMarkReceived(r.id)}
                                >
                                    <CheckCircle className="mr-1 h-3.5 w-3.5" />
                                    {loading === r.id ? "Saving..." : "Mark Received"}
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
