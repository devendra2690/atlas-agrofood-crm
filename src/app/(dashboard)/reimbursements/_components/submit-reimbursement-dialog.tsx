"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createReimbursement } from "@/app/actions/reimbursement";
import { Plus, Loader2, UploadCloud } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function SubmitReimbursementDialog() {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("General");
    const [receiptUrl, setReceiptUrl] = useState<string | null>(null);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const uploadRes = await fetch("/api/upload", {
                method: "POST",
                body: formData
            });
            const uploadData = await uploadRes.json();

            if (uploadData.success && uploadData.url) {
                toast.success("Receipt uploaded successfully");
                setReceiptUrl(uploadData.url);
            } else {
                toast.error("Upload failed");
            }
        } catch (err) {
            toast.error("Error uploading file");
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    const handleSubmit = async () => {
        if (!amount || !description) {
            toast.error("Amount and Description are required");
            return;
        }

        setLoading(true);
        const result = await createReimbursement({
            amount: parseFloat(amount),
            description,
            category,
            receiptUrl: receiptUrl || undefined
        });

        if (result.success) {
            toast.success("Reimbursement claim submitted successfully");
            setIsOpen(false);
            setAmount("");
            setDescription("");
            setCategory("General");
            setReceiptUrl(null);
        } else {
            toast.error(result.error || "Failed to submit claim");
        }
        setLoading(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Submit Claim
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Submit Reimbursement Claim</DialogTitle>
                    <DialogDescription>
                        Log an out-of-pocket business expense for approval.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Description <span className="text-red-500">*</span></Label>
                        <Input 
                            value={description} 
                            onChange={(e) => setDescription(e.target.value)} 
                            placeholder="e.g. Client Lunch, Taxi fare" 
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label>Category</Label>
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Travel & Transport">Travel & Transport</SelectItem>
                                <SelectItem value="Meals & Entertainment">Meals & Entertainment</SelectItem>
                                <SelectItem value="Office Supplies">Office Supplies</SelectItem>
                                <SelectItem value="Internet & Phone">Internet & Phone</SelectItem>
                                <SelectItem value="General">General</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    
                    <div className="grid gap-2">
                        <Label>Amount (₹) <span className="text-red-500">*</span></Label>
                        <Input 
                            type="number" 
                            value={amount} 
                            onChange={(e) => setAmount(e.target.value)} 
                            placeholder="e.g. 1500" 
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label>Receipt (Optional)</Label>
                        {receiptUrl ? (
                            <div className="flex items-center gap-2 p-2 border rounded bg-slate-50 text-sm">
                                <span className="truncate flex-1 text-blue-600">
                                    <a href={receiptUrl} target="_blank" rel="noreferrer">View Uploaded Receipt</a>
                                </span>
                                <Button variant="ghost" size="sm" onClick={() => setReceiptUrl(null)} className="h-6 px-2 text-red-500">
                                    Remove
                                </Button>
                            </div>
                        ) : (
                            <div className="relative">
                                <Input
                                    type="file"
                                    accept=".pdf,image/*"
                                    onChange={handleUpload}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-[0px]"
                                    disabled={uploading}
                                />
                                <Button variant="outline" className="w-full border-dashed">
                                    {uploading ? (
                                        <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Uploading...</>
                                    ) : (
                                        <><UploadCloud className="h-4 w-4 mr-2 text-slate-500" /> Attach Receipt</>
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={loading || !amount || !description || uploading}>
                        {loading ? "Submitting..." : "Submit Claim"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
