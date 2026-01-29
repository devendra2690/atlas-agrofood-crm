"use client";

import { useEffect, useState } from "react";
import { getSourcingRequests, updateSourcingRequestStatus } from "@/app/actions/matrix";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, AlertCircle } from "lucide-react";
import { SourcingRequestStatus } from "@prisma/client";
import { format } from "date-fns";
import { toast } from "sonner";

export function SourcingRequestBoard() {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        setLoading(true);
        const res = await getSourcingRequests();
        if (res.success && res.data) {
            setRequests(res.data);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleStatusChange = async (id: string, status: string) => {
        const res = await updateSourcingRequestStatus(id, status as SourcingRequestStatus);
        if (res.success) {
            toast.success("Status updated");
            loadData();
        } else {
            toast.error("Failed to update status");
        }
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    if (requests.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                No active sourcing requests.
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {requests.map((request) => (
                <Card key={request.id} className={request.priority === 'URGENT' ? "border-amber-200 bg-amber-50/30" : ""}>
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                            <div className="font-semibold text-lg">{request.requestedItem}</div>
                            {request.priority === 'URGENT' && (
                                <Badge variant="destructive" className="flex items-center gap-1 text-[10px] h-5">
                                    <AlertCircle className="h-3 w-3" /> URGENT
                                </Badge>
                            )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                            Volume: {request.volume || "Not specified"}
                        </div>
                    </CardHeader>
                    <CardContent className="pb-2">
                        <div className="text-xs text-muted-foreground mb-4">
                            Requested by <span className="font-medium text-slate-700">{request.salesUser.name}</span>
                            <br />
                            {format(new Date(request.createdAt), "PPP")}
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground">Current Status</label>
                            <Select
                                value={request.status}
                                onValueChange={(val) => handleStatusChange(request.id, val)}
                            >
                                <SelectTrigger className="h-8">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="OPEN">Open</SelectItem>
                                    <SelectItem value="RESEARCH">Market Research</SelectItem>
                                    <SelectItem value="SAMPLING">Internal Sampling</SelectItem>
                                    <SelectItem value="ONBOARDED">Vendor Onboarded</SelectItem>
                                    <SelectItem value="UNAVAILABLE">Unavailable</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
