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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { updateSampleDetails, UpdateSampleData, updateSubmissionStatus } from "@/app/actions/sample";
import { Loader2, Pencil, X, Upload, Check } from "lucide-react";
import { toast } from "sonner";
import { OpportunityPriceType, SampleStatus } from "@prisma/client";
import { cn } from "@/lib/utils";

interface UpdateSampleDialogProps {
    sample: any;
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function UpdateSampleDialog({ sample, trigger, open: controlledOpen, onOpenChange: setControlledOpen }: UpdateSampleDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
    const setOpen = setControlledOpen || setInternalOpen;

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<UpdateSampleData>({
        priceQuoted: sample.priceQuoted ?? undefined,
        priceUnit: sample.priceUnit ?? "PER_KG",
        images: sample.images ?? [],
        qualityNotes: sample.qualityNotes ?? "",
        feedback: sample.feedback ?? "",
        notes: sample.notes ?? "",
        status: sample.status
    });

    async function handleUpdate() {
        setLoading(true);
        try {
            const result = await updateSampleDetails(sample.id, formData);
            if (result.success) {
                toast.success("Sample details updated");
                setOpen(false);
            } else {
                toast.error(result.error || "Failed to update");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmissionStatus(submissionId: string, status: SampleStatus) {
        const toastId = toast.loading("Updating status...");
        try {
            const result = await updateSubmissionStatus(submissionId, status);
            if (result.success) {
                toast.success("Status updated", { id: toastId });
            } else {
                toast.error("Failed to update status", { id: toastId });
            }
        } catch (error) {
            toast.error("An error occurred", { id: toastId });
        }
    }

    const compressImage = (file: File): Promise<string> => {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = URL.createObjectURL(file);
            img.onload = () => {
                const canvas = document.createElement("canvas");
                let width = img.width;
                let height = img.height;
                const MAX_WIDTH = 800;

                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                ctx?.drawImage(img, 0, 0, width, height);

                // Compress to JPEG 0.7 quality
                resolve(canvas.toDataURL("image/jpeg", 0.7));
            };
        });
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            const toastId = toast.loading("Compressing images...");
            setLoading(true);

            const newImages: string[] = [];

            try {
                for (let i = 0; i < files.length; i++) {
                    const compressed = await compressImage(files[i]);
                    newImages.push(compressed);
                }

                setFormData(prev => ({
                    ...prev,
                    images: [...(prev.images || []), ...newImages]
                }));
                toast.success("Images added", { id: toastId });
            } catch (error) {
                console.error(error);
                toast.error("Failed to process images", { id: toastId });
            } finally {
                setLoading(false);
                e.target.value = "";
            }
        }
    };

    const removeImage = (index: number) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images?.filter((_, i) => i !== index)
        }));
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="ghost" size="icon">
                        <Pencil className="h-4 w-4" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Update Sample Details</DialogTitle>
                    <DialogDescription>
                        Update information for sample from <strong>{sample.vendor?.name}</strong>.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                    {/* Linked Clients UI - New Section */}
                    {sample.submissions && sample.submissions.length > 0 && (
                        <div className="space-y-3 p-4 bg-slate-50 rounded-lg border">
                            <h4 className="font-semibold text-sm flex items-center gap-2">
                                <span className="bg-blue-100 text-blue-700 p-1 rounded">🔗</span> Linked Clients
                            </h4>
                            <div className="space-y-3">
                                {sample.submissions.map((sub: any) => (
                                    <div key={sub.id} className="flex items-center justify-between bg-white p-2 rounded border text-sm">
                                        <div>
                                            <div className="font-medium">{sub.opportunity?.company?.name}</div>
                                            <div className="text-xs text-muted-foreground">{sub.opportunity?.productName}</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {/* Status Badge */}
                                            <div className={cn(
                                                "text-xs font-medium px-2 py-1 rounded",
                                                sub.status === "CLIENT_APPROVED" ? "bg-green-100 text-green-700" :
                                                    sub.status === "CLIENT_REJECTED" ? "bg-red-100 text-red-700" :
                                                        "bg-slate-100 text-slate-700"
                                            )}>
                                                {sub.status.replace(/_/g, " ")}
                                            </div>

                                            {/* Actions */}
                                            {sub.status !== "CLIENT_APPROVED" && sub.status !== "CLIENT_REJECTED" && (
                                                <div className="flex gap-1 ml-2">
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                        onClick={() => handleSubmissionStatus(sub.id, "CLIENT_APPROVED")}
                                                        title="Approve for Client"
                                                    >
                                                        <Check className="h-3 w-3" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-6 w-6 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        onClick={() => handleSubmissionStatus(sub.id, "CLIENT_REJECTED")}
                                                        title="Reject for Client"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}


                    <div className="grid gap-2">
                        <Label>Price Quote</Label>
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <Input
                                    type="number"
                                    placeholder="0.00"
                                    value={formData.priceQuoted || ""}
                                    onChange={(e) => setFormData({ ...formData, priceQuoted: Number(e.target.value) })}
                                />
                            </div>
                            <Select
                                value={formData.priceUnit}
                                onValueChange={(v) => setFormData({ ...formData, priceUnit: v as OpportunityPriceType })}
                            >
                                <SelectTrigger className="w-[120px]">
                                    <SelectValue placeholder="Unit" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PER_KG">Per Kg</SelectItem>
                                    <SelectItem value="PER_MT">Per MT</SelectItem>
                                    <SelectItem value="TOTAL_AMOUNT">Total</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label>Sample Photos</Label>
                        <div className="grid grid-cols-4 gap-2 mb-2">
                            {formData.images?.map((img, i) => (
                                <div key={i} className="relative aspect-square border rounded-md overflow-hidden group">
                                    <img src={img} alt={`Preview ${i}`} className="w-full h-full object-cover" />
                                    <button
                                        onClick={() => removeImage(i)}
                                        className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            ))}
                            <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-md aspect-square cursor-pointer hover:bg-slate-50">
                                <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                                <span className="text-[10px] text-muted-foreground">Add</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                            </label>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="quality">Quality Notes (Inspection)</Label>
                        <Textarea
                            id="quality"
                            placeholder="e.g. Color is consistent, texture fine..."
                            value={formData.qualityNotes || ""}
                            onChange={(e) => setFormData({ ...formData, qualityNotes: e.target.value })}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="feedback">Internal Feedback</Label>
                        <Textarea
                            id="feedback"
                            placeholder="Global feedback on the sample..."
                            value={formData.feedback || ""}
                            onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="status">Global Status</Label>
                        <Select
                            value={formData.status}
                            onValueChange={(val) => setFormData({ ...formData, status: val as any })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="REQUESTED">Requested</SelectItem>
                                <SelectItem value="SENT">Sent</SelectItem>
                                <SelectItem value="RECEIVED">Received</SelectItem>
                                <SelectItem value="Result_APPROVED_INTERNAL">Approved (Internal)</SelectItem>
                                <SelectItem value="Result_REJECTED">Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-[10px] text-muted-foreground">
                            Note: Changing status here updates the sample globally.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={handleUpdate} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog >
    );
}
