"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, CreditCard } from "lucide-react";
import { recordInvoicePayment } from "@/app/actions/finance";
import { format } from "date-fns";

interface RecordInvoicePaymentDialogProps {
    invoice: {
        id: string;
        pendingAmount: number;
        totalAmount: number;
    };
}

export function RecordInvoicePaymentDialog({ invoice }: RecordInvoicePaymentDialogProps) {
    const [open, setOpen] = useState(false);
    const [amount, setAmount] = useState(invoice.pendingAmount.toString());
    const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
    const [loading, setLoading] = useState(false);
    const [receipts, setReceipts] = useState<string[]>([]);

    // Compression Helper
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
                resolve(canvas.toDataURL("image/jpeg", 0.7));
            };
        });
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            const toastId = toast.loading("Compressing receipts...");
            try {
                const newReceipts: string[] = [];
                for (let i = 0; i < files.length; i++) {
                    const compressed = await compressImage(files[i]);
                    newReceipts.push(compressed);
                }
                setReceipts(prev => [...prev, ...newReceipts]);
                toast.success("Receipts added", { id: toastId });
            } catch (error) {
                toast.error("Failed to process images", { id: toastId });
            } finally {
                e.target.value = "";
            }
        }
    };

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        try {
            const result = await recordInvoicePayment({
                invoiceId: invoice.id,
                amount: parseFloat(amount),
                date: new Date(date),
                receipts: receipts
            });

            if (result.success) {
                toast.success("Payment recorded successfully");
                setOpen(false);
                setReceipts([]);
            } else {
                toast.error(result.error || "Failed to record payment");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1 text-green-600 border-green-200 hover:bg-green-50">
                    <CreditCard className="h-3.5 w-3.5" />
                    Record Payment
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Record Invoice Payment</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label>Payment Amount received</Label>
                        <Input
                            type="number"
                            step="0.01"
                            max={invoice.pendingAmount}
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                        />
                        <p className="text-xs text-muted-foreground">
                            Pending: ₹{invoice.pendingAmount.toLocaleString()}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label>Payment Date</Label>
                        <Input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Upload Receipt/Proof (Optional)</Label>
                        <div className="grid grid-cols-3 gap-2">
                            {receipts.map((img, i) => (
                                <div key={i} className="relative aspect-square border rounded overflow-hidden group">
                                    <img src={img} alt="Receipt" className="object-cover w-full h-full" />
                                    <button
                                        type="button"
                                        onClick={() => setReceipts(p => p.filter((_, idx) => idx !== i))}
                                        className="absolute top-0 right-0 p-1 bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        &times;
                                    </button>
                                </div>
                            ))}
                            <label className="flex items-center justify-center border-2 border-dashed rounded aspect-square cursor-pointer hover:bg-slate-50">
                                <span className="text-xs text-muted-foreground">+ Add</span>
                                <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Record Payment
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
