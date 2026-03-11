"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ReimbursementActionDialog } from "./reimbursement-action-dialog";
import { ResubmitReimbursementDialog } from "./resubmit-reimbursement-dialog";

interface ReimbursementListProps {
    reimbursements: any[];
    isAdmin: boolean;
}

export function ReimbursementList({ reimbursements, isAdmin }: ReimbursementListProps) {
    if (reimbursements.length === 0) {
        return (
            <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
                No reimbursement claims found.
            </div>
        );
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return 'bg-yellow-100 text-yellow-800';
            case 'APPROVED': return 'bg-blue-100 text-blue-800';
            case 'PAID': return 'bg-green-100 text-green-800';
            case 'REJECTED': return 'bg-red-100 text-red-800';
            default: return 'bg-slate-100 text-slate-800';
        }
    };

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        {isAdmin && <TableHead>Employee</TableHead>}
                        <TableHead>Description</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Receipt</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {reimbursements.map((r) => (
                        <TableRow key={r.id}>
                            <TableCell>{format(new Date(r.date), "MMM d, yyyy")}</TableCell>
                            {isAdmin && (
                                <TableCell className="font-medium">
                                    {r.user?.name || r.user?.email}
                                </TableCell>
                            )}
                            <TableCell className="max-w-[200px] truncate" title={r.description}>
                                {r.description}
                                {r.adminNotes && (
                                    <div className="text-xs text-muted-foreground mt-1 line-clamp-1" title={r.adminNotes}>
                                        Note: {r.adminNotes}
                                    </div>
                                )}
                            </TableCell>
                            <TableCell className="font-semibold text-slate-700">
                                ₹{r.amount.toLocaleString()}
                            </TableCell>
                            <TableCell>
                                <Badge className={getStatusColor(r.status)} variant="outline">
                                    {r.status}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                {r.receiptUrl ? (
                                    <a href={r.receiptUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">
                                        View
                                    </a>
                                ) : (
                                    <span className="text-xs text-muted-foreground">None</span>
                                )}
                            </TableCell>
                            <TableCell className="text-right">
                                {isAdmin ? (
                                    <ReimbursementActionDialog reimbursement={r} />
                                ) : r.status === 'REJECTED' ? (
                                    <ResubmitReimbursementDialog reimbursement={r} />
                                ) : (
                                    <span className="text-xs text-muted-foreground">-</span>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
