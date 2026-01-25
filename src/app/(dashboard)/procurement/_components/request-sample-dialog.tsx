"use client";

import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createSampleRequest } from "@/app/actions/sample";
import { TestTube, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface RequestSampleDialogProps {
    projectId: string;
    vendorId: string;
    vendorName: string;
    trigger?: React.ReactNode;
}

export function RequestSampleDialog({ projectId, vendorId, vendorName, trigger }: RequestSampleDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [notes, setNotes] = useState("");

    async function handleRequest() {
        setLoading(true);
        try {
            const result = await createSampleRequest(projectId, vendorId, notes);
            if (result.success) {
                toast.success(`Sample requested from ${vendorName}`);
                setOpen(false);
                setNotes("");
            } else {
                toast.error("Failed to request sample");
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
                {trigger || (
                    <Button variant="outline" size="sm">
                        <TestTube className="h-4 w-4 mr-2" />
                        Request Sample
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Request Sample</DialogTitle>
                    <DialogDescription>
                        Request a material sample from <strong>{vendorName}</strong>.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="notes">Notes / Instructions</Label>
                        <Textarea
                            id="notes"
                            placeholder="e.g. Please send 500g sample of Banana Powder linked to this project..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleRequest} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {loading ? "Requesting..." : "Send Request"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
