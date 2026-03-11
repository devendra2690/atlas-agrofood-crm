"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { updateReimbursementStatus, payReimbursement } from "@/app/actions/reimbursement";
import { ClipboardCheck } from "lucide-react";

interface ReimbursementActionDialogProps {
    reimbursement: any;
}

export function ReimbursementActionDialog({ reimbursement }: ReimbursementActionDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [adminNotes, setAdminNotes] = useState(reimbursement.adminNotes || "");

    const handleAction = async (action: 'APPROVED' | 'REJECTED' | 'PAY') => {
        setLoading(true);
        let result;

        if (action === 'PAY') {
            result = await payReimbursement(reimbursement.id, adminNotes);
        } else {
            result = await updateReimbursementStatus(reimbursement.id, action, adminNotes);
        }

        if (result.success) {
            toast.success(`Claim marked as ${action}`);
            setIsOpen(false);
        } else {
            toast.error(result.error || `Failed to ${action} claim`);
        }
        setLoading(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                    <ClipboardCheck className="h-4 w-4 mr-2 text-blue-600" />
                    Review
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Review Reimbursement Claim</DialogTitle>
                    <DialogDescription>
                        Process {reimbursement.user?.name}'s expense claim.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="font-semibold text-muted-foreground">Amount:</div>
                        <div className="font-bold">₹{reimbursement.amount.toLocaleString()}</div>
                        
                        <div className="font-semibold text-muted-foreground">Description:</div>
                        <div>{reimbursement.description}</div>
                        
                        {reimbursement.receiptUrl && (
                            <>
                                <div className="font-semibold text-muted-foreground">Receipt:</div>
                                <div>
                                    <a href={reimbursement.receiptUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                                        View Attachment
                                    </a>
                                </div>
                            </>
                        )}
                    </div>
                    
                    <div className="grid gap-2 mt-4">
                        <Label>Admin Notes (Optional)</Label>
                        <Input 
                            value={adminNotes} 
                            onChange={(e) => setAdminNotes(e.target.value)} 
                            placeholder="Reason for rejection or approval notes" 
                        />
                    </div>
                </div>

                <DialogFooter className="flex gap-2 sm:justify-start">
                    {reimbursement.status === 'PENDING' && (
                        <>
                            <Button variant="destructive" onClick={() => handleAction('REJECTED')} disabled={loading}>
                                Reject
                            </Button>
                            <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleAction('APPROVED')} disabled={loading}>
                                Approve
                            </Button>
                        </>
                    )}
                    
                    {reimbursement.status === 'APPROVED' && (
                        <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => handleAction('PAY')} disabled={loading}>
                            Mark as Paid (Deduct from Ledger)
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
