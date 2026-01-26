"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { format } from "date-fns";
import { ArrowRight, Package, ShoppingCart, Users, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteProcurementProject } from "@/app/actions/procurement"; // Import delete action
import { toast } from "sonner";
import { ProcurementDialog } from "./procurement-dialog"; // Import dialog

interface ProcurementListProps {
    projects: any[];
    commodities?: any[]; // Add commodities prop
}

export function ProcurementList({ projects, commodities = [] }: ProcurementListProps) {
    const router = useRouter();

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent row click
        if (confirm("Are you sure you want to delete this project?")) {
            const result = await deleteProcurementProject(id);
            if (result.success) {
                toast.success("Project deleted");
            } else {
                toast.error("Failed to delete project");
            }
        }
    };

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Project Name</TableHead>
                    <TableHead>Commodity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Linked Opportunities</TableHead>
                    <TableHead>Vendors</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Updated By</TableHead>
                    <TableHead></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {projects.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                            No active sourcing projects. Create one to get started.
                        </TableCell>
                    </TableRow>
                ) : (
                    projects.map((project) => (
                        <TableRow
                            key={project.id}
                            className="group cursor-pointer hover:bg-muted/50"
                            onClick={() => router.push(`/procurement/${project.id}`)}
                        >
                            <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                    <Package className="h-4 w-4 text-slate-500" />
                                    {project.name}
                                </div>
                            </TableCell>
                            <TableCell>
                                {project.commodity ? (
                                    <Badge variant="outline" className="font-normal">
                                        {project.commodity.name}
                                    </Badge>
                                ) : (
                                    <span className="text-muted-foreground text-sm">-</span>
                                )}
                            </TableCell>
                            <TableCell>
                                <Badge variant={project.status === 'SOURCING' ? 'default' : 'secondary'}>
                                    {project.status}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <ShoppingCart className="h-3 w-3" />
                                    {project._count.salesOpportunities}
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <Users className="h-3 w-3" />
                                    {project._count.projectVendors}
                                </div>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                                {project.createdBy?.name || "-"}
                                <br />
                                {format(new Date(project.createdAt), "MMM d, HH:mm")}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                                {project.updatedBy?.name || "-"}
                                <br />
                                {format(new Date(project.updatedAt), "MMM d, HH:mm")}
                            </TableCell>
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                                            <span className="sr-only">Open menu</span>
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <div onClick={(e) => e.stopPropagation()}>
                                            <ProcurementDialog
                                                commodities={commodities}
                                                project={project}
                                                trigger={
                                                    <div className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                                                        <Pencil className="mr-2 h-4 w-4" />
                                                        Edit
                                                    </div>
                                                }
                                            />
                                        </div>
                                        <DropdownMenuItem onClick={(e) => handleDelete(project.id, e)} className="text-destructive focus:text-destructive">
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
    );
}
