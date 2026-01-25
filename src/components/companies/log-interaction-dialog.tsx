'use client'

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { logInteraction } from "@/app/actions/interaction";
import { Plus } from "lucide-react";
import { toast } from "sonner";

interface LogInteractionDialogProps {
    companyId: string;
}

export function LogInteractionDialog({ companyId }: LogInteractionDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        try {
            const description = formData.get("description") as string;
            // Handle date properly, making sure it's not null/empty string
            const nextFollowUpRaw = formData.get("nextFollowUp") as string;
            const nextFollowUp = nextFollowUpRaw ? new Date(nextFollowUpRaw) : undefined;
            const status = formData.get("status") as "FOLLOW_UP_SCHEDULED" | "CLOSED";

            const result = await logInteraction({
                companyId,
                description,
                nextFollowUp,
                status
            });

            if (result.success) {
                toast.success("Interaction logged", {
                    description: "The interaction has been successfully recorded."
                });
                setOpen(false);
            } else {
                toast.error("Error", {
                    description: result.error
                });
            }
        } catch (error) {
            toast.error("Error", {
                description: "Something went wrong"
            });
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Log Interaction
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Log Interaction</DialogTitle>
                    <DialogDescription>
                        Record a call, meeting, or update for this company.
                    </DialogDescription>
                </DialogHeader>
                <form action={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="description">Notes / Description</Label>
                            <Textarea
                                id="description"
                                name="description"
                                placeholder="Discussed requirements..."
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="nextFollowUp">Next Follow Up</Label>
                                <Input
                                    id="nextFollowUp"
                                    name="nextFollowUp"
                                    type="date"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="status">Status</Label>
                                <Select name="status" defaultValue="FOLLOW_UP_SCHEDULED">
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="FOLLOW_UP_SCHEDULED">Follow Up Scheduled</SelectItem>
                                        <SelectItem value="CLOSED">Closed / Done</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Saving..." : "Save Log"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
