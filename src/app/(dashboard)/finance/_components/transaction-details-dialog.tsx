"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Eye, FileText } from "lucide-react";

interface TransactionDetailsDialogProps {
    transaction: {
        id: string;
        amount: number;
        date: string | Date;
        type: 'CREDIT' | 'DEBIT';
        category?: string | null;
        description?: string | null;
        reference?: string | null;
        receipts?: string[] | null;
        linkedTo?: string | null;
    };
    trigger?: React.ReactNode;
}

export function TransactionDetailsDialog({ transaction, trigger }: TransactionDetailsDialogProps) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <Eye className="h-4 w-4" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Transaction Details</DialogTitle>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                    {/* Header Info */}
                    <div className="flex items-center justify-between border-b pb-4">
                        <div className="space-y-1">
                            <h3 className="font-semibold text-lg">{transaction.description || "Transaction"}</h3>
                            <p className="text-sm text-muted-foreground">
                                {format(new Date(transaction.date), "MMMM d, yyyy")}
                            </p>
                        </div>
                        <div className={`text-2xl font-bold ${transaction.type === 'CREDIT' ? 'text-emerald-600' : 'text-rose-600'
                            }`}>
                            {transaction.type === 'CREDIT' ? '+' : '-'}₹{transaction.amount.toLocaleString()}
                        </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-muted-foreground">Category:</span>
                            <div className="font-medium mt-1">
                                {transaction.category ? <Badge variant="outline">{transaction.category}</Badge> : "-"}
                            </div>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Reference:</span>
                            <div className="font-medium mt-1 break-all">
                                {transaction.reference || transaction.id.slice(0, 8).toUpperCase()}
                            </div>
                        </div>
                        {transaction.linkedTo && (
                            <div className="col-span-2">
                                <span className="text-muted-foreground">Linked To:</span>
                                <div className="font-medium mt-1">{transaction.linkedTo}</div>
                            </div>
                        )}
                    </div>

                    {/* Receipts / Attachments */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold flex items-center gap-2 border-t pt-4">
                            <FileText className="h-4 w-4" />
                            Receipts / Attachments
                        </h4>

                        {!transaction.receipts || transaction.receipts.length === 0 ? (
                            <div className="p-8 text-center bg-slate-50 rounded-lg text-muted-foreground text-sm border border-dashed">
                                No receipts attached.
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {transaction.receipts.map((img, i) => (
                                    <div key={i} className="group relative aspect-[3/4] bg-slate-100 rounded-lg overflow-hidden border cursor-zoom-in" onClick={() => window.open(img, '_blank')}>
                                        <img
                                            src={img}
                                            alt={`Receipt ${i + 1}`}
                                            className="w-full h-full object-contain p-2 hover:scale-105 transition-transform"
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
