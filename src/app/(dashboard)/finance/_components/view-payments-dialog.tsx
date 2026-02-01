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
import { Eye, FileText, Receipt } from "lucide-react";

interface Transaction {
    id: string;
    amount: number;
    date: Date | string;
    type: 'CREDIT' | 'DEBIT';
    description?: string | null;
    receipts?: string[] | null;
}

interface ViewPaymentsDialogProps {
    transactions: Transaction[];
    title?: string;
    trigger?: React.ReactNode;
}

export function ViewPaymentsDialog({ transactions, title = "Related Payments", trigger }: ViewPaymentsDialogProps) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Eye className="h-4 w-4" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-4">
                    {transactions.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground bg-slate-50 rounded-lg">
                            No payments recorded yet.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {transactions.map((tx) => (
                                <div key={tx.id} className="border rounded-lg p-4 space-y-3 bg-white">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <div className="font-medium flex items-center gap-2">
                                                {tx.description || (tx.type === 'CREDIT' ? "Payment Received" : "Payment Made")}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {format(new Date(tx.date), "MMM d, yyyy")}
                                            </div>
                                        </div>
                                        <Badge variant={tx.type === 'CREDIT' ? 'default' : 'destructive'}>
                                            {tx.type === 'CREDIT' ? '+' : '-'}₹{tx.amount.toLocaleString()}
                                        </Badge>
                                    </div>

                                    {/* Receipts Section */}
                                    {tx.receipts && tx.receipts.length > 0 && (
                                        <div className="pt-2 border-t">
                                            <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                                                <FileText className="h-3 w-3" /> Receipts
                                            </p>
                                            <div className="flex gap-2 overflow-x-auto pb-2">
                                                {tx.receipts.map((img, i) => (
                                                    <div
                                                        key={i}
                                                        className="relative h-20 w-20 flex-shrink-0 border rounded overflow-hidden cursor-zoom-in group"
                                                        onClick={() => window.open(img, '_blank')}
                                                    >
                                                        <img src={img} alt="Receipt" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
