"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { createSourcingRequest } from "@/app/actions/matrix";
import { toast } from "sonner";
import { Sourcingpriority } from "@prisma/client";

interface SourcingRequestDialogProps {
    initialItem?: string;
    trigger?: React.ReactNode;
}

export function SourcingRequestDialog({ initialItem, trigger }: SourcingRequestDialogProps) {
    const [open, setOpen] = useState(false);
    const [item, setItem] = useState(initialItem || "");
    const [volume, setVolume] = useState("");
    const [priority, setPriority] = useState<Sourcingpriority>("NORMAL");
    const [isPending, startTransition] = useTransition();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!item) {
            toast.error("Please specify what you are looking for");
            return;
        }

        startTransition(async () => {
            const result = await createSourcingRequest({
                item,
                volume,
                priority
            });

            if (result.success) {
                toast.success("Sourcing request sent to Procurement team");
                setOpen(false);
                setVolume("");
                setPriority("NORMAL");
            } else {
                toast.error(`Failed: ${result.error}`);
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="default">Request Sourcing</Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Request Sourcing</DialogTitle>
                    <DialogDescription>
                        Tell us what you need, and the procurement team will find a supplier.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="item">Commodity / Variety</Label>
                        <Input
                            id="item"
                            value={item}
                            onChange={(e) => setItem(e.target.value)}
                            placeholder="e.g. Alphonso Mango"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="volume">Potential Volume</Label>
                        <Input
                            id="volume"
                            value={volume}
                            onChange={(e) => setVolume(e.target.value)}
                            placeholder="e.g. 50 MT / Month"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="priority">Priority</Label>
                        <Select value={priority} onValueChange={(v) => setPriority(v as Sourcingpriority)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="NORMAL">Normal</SelectItem>
                                <SelectItem value="URGENT">Urgent (High Value Lead)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex justify-end pt-2">
                        <Button type="submit" disabled={isPending}>
                            {isPending ? "Submitting..." : "Submit Request"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
