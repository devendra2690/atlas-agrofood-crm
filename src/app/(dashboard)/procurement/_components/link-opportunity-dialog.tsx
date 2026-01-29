"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { getUnassignedOpportunities, linkOpportunityToProject } from "@/app/actions/procurement";
import { LinkIcon } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

interface LinkOpportunityDialogProps {
    projectId: string;
    projectType?: string;
    currentLinksCount?: number;
}

export function LinkOpportunityDialog({ projectId, projectType, currentLinksCount = 0 }: LinkOpportunityDialogProps) {
    // 1. Hide if Sample Project
    if (projectType === 'SAMPLE') return null;

    // 2. Hide if Project and already has 1 link
    if (projectType === 'PROJECT' && currentLinksCount >= 1) return null;

    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [opportunities, setOpportunities] = useState<any[]>([]);
    const [selectedOppId, setSelectedOppId] = useState<string>("");

    useEffect(() => {
        if (open) {
            loadOpportunities();
        }
    }, [open]);

    async function loadOpportunities() {
        const result = await getUnassignedOpportunities();
        if (result.success && result.data) {
            setOpportunities(result.data);
        }
    }

    async function handleLink() {
        if (!selectedOppId) return;
        setLoading(true);
        try {
            const result = await linkOpportunityToProject(projectId, selectedOppId);
            if (result.success) {
                toast.success("Opportunity linked successfully");
                setOpen(false);
            } else {
                toast.error("Failed to link opportunity");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm">
                    <LinkIcon className="h-4 w-4 mr-2" />
                    Link Opportunity
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Link Sales Opportunity</DialogTitle>
                    <DialogDescription>
                        Associate an open sales deal with this sourcing project.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Select Opportunity</Label>
                        <Select value={selectedOppId} onValueChange={setSelectedOppId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select opportunity..." />
                            </SelectTrigger>
                            <SelectContent>
                                {opportunities.length === 0 ? (
                                    <SelectItem value="none" disabled>No unassigned opportunities found</SelectItem>
                                ) : (
                                    opportunities.map((opp) => (
                                        <SelectItem key={opp.id} value={opp.id}>
                                            {opp.productName} - {opp.company.name} ({opp.quantity ? `${opp.quantity}MT` : 'No Qty'})
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleLink} disabled={loading || !selectedOppId}>
                        {loading ? "Linking..." : "Link Opportunity"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
