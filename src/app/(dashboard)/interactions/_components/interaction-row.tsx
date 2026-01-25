"use client";

import { useState } from "react";
import { format } from "date-fns";
import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, MessageSquare } from "lucide-react";
import Link from "next/link";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface InteractionRowProps {
    interaction: any; // Ideally types from Prisma
}

export function InteractionRow({ interaction }: InteractionRowProps) {
    const [open, setOpen] = useState(false);

    // Stop propagation for links inside the row to avoid opening dialog when clicking link
    const handleLinkClick = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    return (
        <>
            <TableRow
                className="cursor-pointer hover:bg-slate-50"
                onClick={() => setOpen(true)}
            >
                <TableCell className="w-[180px]">
                    <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="mr-2 h-4 w-4" />
                        {format(new Date(interaction.date), "MMM d, yyyy h:mm a")}
                    </div>
                </TableCell>
                <TableCell className="font-medium">
                    <Link
                        href={`/companies/${interaction.company.id}`}
                        className="hover:underline text-blue-600"
                        onClick={handleLinkClick}
                    >
                        {interaction.company.name}
                    </Link>
                </TableCell>
                <TableCell>
                    <div className="flex items-center text-sm">
                        <User className="mr-2 h-4 w-4 text-slate-400" />
                        {interaction.user.name}
                    </div>
                </TableCell>
                <TableCell className="max-w-[400px]">
                    <div className="flex items-start">
                        <MessageSquare className="mr-2 h-4 w-4 mt-1 text-slate-400 shrink-0" />
                        <span className="line-clamp-2" title={interaction.description}>
                            {interaction.description}
                        </span>
                    </div>
                </TableCell>
                <TableCell>
                    {interaction.nextFollowUp ? (
                        <div className="flex flex-col gap-1">
                            <Badge variant="outline" className="w-fit border-orange-200 bg-orange-50 text-orange-700">
                                Follow-up Plan
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                                due {format(new Date(interaction.nextFollowUp), "MMM d")}
                            </span>
                        </div>
                    ) : (
                        <Badge variant="secondary" className="bg-slate-100 text-slate-500">
                            No Follow-up
                        </Badge>
                    )}
                </TableCell>
            </TableRow>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Interaction Details</DialogTitle>
                        <DialogDescription>
                            View details of this communication log.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <h4 className="text-sm font-medium text-muted-foreground mb-1">Company</h4>
                                <p className="text-sm font-semibold">{interaction.company.name}</p>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-muted-foreground mb-1">Logged By</h4>
                                <p className="text-sm">{interaction.user.name}</p>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-muted-foreground mb-1">Date</h4>
                                <p className="text-sm">{format(new Date(interaction.date), "PPP p")}</p>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-muted-foreground mb-1">Status</h4>
                                <Badge variant={interaction.status === 'CLOSED' ? 'default' : 'secondary'}>
                                    {interaction.status === 'CLOSED' ? 'Closed' : 'Follow-up Scheduled'}
                                </Badge>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h4 className="text-sm font-medium text-muted-foreground">Description</h4>
                            <div className="rounded-md bg-slate-50 p-4 text-sm leading-relaxed border">
                                {interaction.description}
                            </div>
                        </div>

                        {interaction.nextFollowUp && (
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium text-muted-foreground">Next Follow Up</h4>
                                <div className="flex items-center gap-2 text-sm">
                                    <Calendar className="h-4 w-4 text-orange-500" />
                                    <span className="font-medium">
                                        {format(new Date(interaction.nextFollowUp), "PPP")}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
