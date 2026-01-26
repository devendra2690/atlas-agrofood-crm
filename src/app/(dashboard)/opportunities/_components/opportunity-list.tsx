"use client";

import { useState, Fragment } from "react";
import { format } from "date-fns";
import { Briefcase, Calendar, Package, Factory, CheckCircle, XCircle, Send, Loader2, PlusCircle } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { updateSampleStatus, linkSampleToOpportunity, updateSubmissionStatus } from "@/app/actions/sample";
import { toast } from "sonner";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { OpportunityActions } from "./opportunity-actions";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";


interface OpportunityListProps {
    opportunities: any[]; // Using any because of included relations complexity
    companies: any[];
    commodities: any[];
}

export function OpportunityList({ opportunities, companies, commodities }: OpportunityListProps) {
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [loadingSampleId, setLoadingSampleId] = useState<string | null>(null);

    const handleRowClick = (id: string) => {
        setExpandedId(prev => prev === id ? null : id);
    };

    const handleSampleAction = async (submissionId: string, status: any) => {
        setLoadingSampleId(submissionId);
        try {
            const result = await updateSubmissionStatus(submissionId, status);
            if (result.success) {
                toast.success("Sample status updated");
            } else {
                toast.error("Failed to update sample");
            }
        } catch (e) {
            toast.error("Error updating sample");
        } finally {
            setLoadingSampleId(null);
        }
    };

    const handleLinkSample = async (sampleId: string, oppId: string) => {
        try {
            const result = await linkSampleToOpportunity(sampleId, oppId);
            if (result.success) {
                toast.success("Sample linked to opportunity");
            } else {
                toast.error("Failed to link sample");
            }
        } catch (e) {
            toast.error("Error linking sample");
        }
    };

    const formatPriceUnit = (type: string | undefined) => {
        switch (type) {
            case 'PER_KG': return '/ Kg';
            case 'PER_MT': return '/ MT';
            case 'TOTAL_AMOUNT': return 'Total';
            default: return '';
        }
    };

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Product / Deal</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Updated By</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {opportunities?.map((opp) => {
                    const availableSamples = opp.procurementProject?.samples?.filter((s: any) =>
                        s.status !== 'Result_REJECTED' &&
                        !opp.sampleSubmissions?.some((sub: any) => sub.sampleId === s.id)
                    ) || [];

                    return (
                        <Fragment key={opp.id}>
                            <TableRow
                                className={`cursor-pointer transition-colors ${expandedId === opp.id ? "bg-muted/50" : "hover:bg-muted/50"}`}
                                onClick={() => handleRowClick(opp.id)}
                            >
                                <TableCell className="font-medium">
                                    <div className="flex items-center">
                                        <Briefcase className="mr-2 h-4 w-4 text-slate-500" />
                                        <div>
                                            {opp.productName}
                                            {opp.commodity && (
                                                <div className="text-xs text-muted-foreground font-normal">
                                                    {opp.commodity.name}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div
                                        onClick={(e) => e.stopPropagation()}
                                        className="inline-block"
                                    >
                                        <Link href={`/companies/${opp.company.id}`} className="hover:underline text-blue-600">
                                            {opp.company.name}
                                        </Link>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col text-sm">
                                        {opp.targetPrice && (
                                            <span className="flex items-center text-green-600 font-medium">
                                                <span className="mr-1">₹</span>
                                                {opp.targetPrice.toString()}
                                                <span className="text-muted-foreground ml-1 text-xs">{formatPriceUnit(opp.priceType)}</span>
                                            </span>
                                        )}
                                        {opp.quantity && (
                                            <span className="flex flex-col text-xs mt-1">
                                                <span className="flex items-center text-muted-foreground">
                                                    <Package className="h-3 w-3 mr-1" />
                                                    {opp.quantity.toString()} MT
                                                </span>
                                                {opp.procurementQuantity && (
                                                    <span className="text-[10px] text-amber-700 bg-amber-50 px-1 rounded border border-amber-200 w-fit mt-1" title="Raw Material Needed">
                                                        Req: {opp.procurementQuantity.toString()} MT
                                                    </span>
                                                )}
                                            </span>
                                        )}
                                        {!opp.targetPrice && !opp.quantity && <span className="text-muted-foreground">-</span>}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={
                                        opp.status === 'CLOSED_WON' ? 'default' :
                                            opp.status === 'CLOSED_LOST' ? 'destructive' : 'secondary'
                                    }>
                                        {opp.status.replace('_', ' ')}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {opp.deadline ? (
                                        <div className="flex items-center text-sm text-muted-foreground">
                                            <Calendar className="mr-2 h-3 w-3" />
                                            {format(new Date(opp.deadline), "MMM d, yyyy")}
                                        </div>
                                    ) : (
                                        <span className="text-muted-foreground text-xs">-</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                    {opp.createdBy?.name || "-"}
                                    <br />
                                    {format(new Date(opp.createdAt), "MMM d, HH:mm")}
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                    {opp.updatedBy?.name || "-"}
                                    <br />
                                    {format(new Date(opp.updatedAt), "MMM d, HH:mm")}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div onClick={(e) => e.stopPropagation()}>
                                        <OpportunityActions opportunity={opp} companies={companies} commodities={commodities} />
                                    </div>
                                </TableCell>
                            </TableRow>
                            {expandedId === opp.id && (
                                <TableRow className="bg-muted/30 hover:bg-muted/30">
                                    <TableCell colSpan={7} className="p-0 border-t-0">
                                        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8 bg-slate-50/50 shadow-inner border-b">
                                            <div className="space-y-4">
                                                <div>
                                                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Description / Notes</div>
                                                    <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed bg-white p-3 rounded-md border min-h-[60px]">
                                                        {opp.notes || <span className="text-muted-foreground italic">No additional notes provided.</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <div>
                                                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Deal Configuration</div>
                                                    <div className="bg-white p-3 rounded-md border space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-sm text-muted-foreground">Type:</span>
                                                            <Badge variant="outline">
                                                                {opp.type === 'RECURRING' ? 'Recurring Deal' : 'One-Time Deal'}
                                                            </Badge>
                                                        </div>
                                                        {opp.type === 'RECURRING' && (
                                                            <div className="flex items-center justify-between border-t pt-2 mt-2">
                                                                <span className="text-sm text-muted-foreground">Frequency:</span>
                                                                <span className="text-sm font-medium">{opp.recurringFrequency}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="text-right pt-2">
                                                        <div className="text-xs text-muted-foreground">ID: <span className="font-mono text-[10px]">{opp.id}</span></div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <div>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Linked Samples</div>
                                                        {availableSamples.length > 0 && (
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button size="sm" variant="outline" className="h-6 gap-1 text-xs">
                                                                        <PlusCircle className="h-3 w-3" /> Link Sample
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end" className="w-[240px]">
                                                                    <DropdownMenuLabel>Select from Project</DropdownMenuLabel>
                                                                    <DropdownMenuSeparator />
                                                                    {availableSamples.map((s: any) => (
                                                                        <DropdownMenuItem key={s.id} onClick={() => handleLinkSample(s.id, opp.id)} className="cursor-pointer">
                                                                            <span className="truncate flex-1">{s.vendor?.name}</span>
                                                                            <Badge variant="outline" className="ml-2 text-[10px]">{s.status?.replace("Result_", "")}</Badge>
                                                                        </DropdownMenuItem>
                                                                    ))}
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        )}
                                                    </div>
                                                    <div className="bg-white rounded-md border divide-y overflow-hidden">
                                                        {opp.sampleSubmissions && opp.sampleSubmissions.length > 0 ? (
                                                            opp.sampleSubmissions.map((sub: any) => (
                                                                <div key={sub.id} className="p-3 flex flex-col gap-2">
                                                                    <div className="flex justify-between items-start">
                                                                        <div className="flex items-center gap-2">
                                                                            <Factory className="h-3 w-3 text-slate-400" />
                                                                            <span className="text-sm font-medium">{sub.sample?.vendor?.name || "Unknown"}</span>
                                                                        </div>
                                                                        <Badge variant="outline" className={`text-[10px] h-5 ${sub.status === 'CLIENT_APPROVED' ? 'bg-green-50 text-green-700 border-green-200' : ''}`}>
                                                                            {sub.status.replace("Result_", "").replace(/_/g, " ")}
                                                                        </Badge>
                                                                    </div>

                                                                    {/* Sample Actions */}
                                                                    {sub.status === 'SENT_TO_CLIENT' && (
                                                                        <div className="flex justify-end gap-2 mt-1">
                                                                            <Button
                                                                                size="sm"
                                                                                className="h-7 text-xs bg-green-600 hover:bg-green-700"
                                                                                onClick={() => handleSampleAction(sub.id, 'CLIENT_APPROVED')}
                                                                                disabled={loadingSampleId === sub.id}
                                                                            >
                                                                                {loadingSampleId === sub.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3 mr-1" />}
                                                                                Approve
                                                                            </Button>
                                                                            <Button
                                                                                size="sm"
                                                                                variant="destructive"
                                                                                className="h-7 text-xs"
                                                                                onClick={() => handleSampleAction(sub.id, 'CLIENT_REJECTED')}
                                                                                disabled={loadingSampleId === sub.id}
                                                                            >
                                                                                {loadingSampleId === sub.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3 mr-1" />}
                                                                                Reject
                                                                            </Button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="p-4 text-center text-xs text-muted-foreground italic bg-slate-50">
                                                                No samples linked to this deal yet.
                                                                {availableSamples.length === 0 && (
                                                                    <div className="mt-1 text-[10px] text-slate-400">
                                                                        (No available samples in linked project)
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </Fragment>
                    );
                })}
                {(!opportunities || opportunities.length === 0) && (
                    <TableRow>
                        <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                            No opportunities found.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
}
