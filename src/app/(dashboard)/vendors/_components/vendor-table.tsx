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
import { Building, MapPin, Phone, MoreHorizontal, ArrowRight, Eye } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TrustLevelSelector } from "./trust-level-selector";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Trash2, Pencil } from "lucide-react";
import { DeleteCompanyDialog } from "../../companies/_components/delete-company-dialog";

interface VendorTableProps {
    vendors: any[];
}

export function VendorTable({ vendors }: VendorTableProps) {
    const router = useRouter();

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Vendor Name</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Projects</TableHead>
                    <TableHead>Commodities</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {vendors.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No vendors found. Add a company with type 'VENDOR' in the Companies section to see them here.
                        </TableCell>
                    </TableRow>
                ) : (
                    vendors.map((vendor) => (
                        <TableRow
                            key={vendor.id}
                            className="group cursor-pointer hover:bg-muted/50"
                            onClick={() => router.push(`/vendors/${vendor.id}`)}
                        >
                            <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                    <Building className="h-4 w-4 text-slate-500" />
                                    {vendor.name}
                                </div>
                            </TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                                <TrustLevelSelector
                                    vendorId={vendor.id}
                                    currentLevel={vendor.trustLevel || 'UNRATED'}
                                />
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <MapPin className="h-3 w-3" />
                                    {vendor.city ? `${vendor.city.name}, ${vendor.country?.name}` : 'N/A'}
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="text-sm">
                                    {vendor.phone && (
                                        <div className="flex items-center gap-1">
                                            <Phone className="h-3 w-3 text-muted-foreground" />
                                            {vendor.phone}
                                        </div>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge variant="secondary">{vendor._count?.projectVendors || 0} Projects</Badge>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-wrap gap-1">
                                    {vendor.commodities?.map((c: any) => (
                                        <Badge key={c.id} variant="outline" className="text-xs">{c.name}</Badge>
                                    ))}
                                </div>
                            </TableCell>
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/vendors/${vendor.id}`); }}>
                                            <Eye className="mr-2 h-4 w-4" /> View Details
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); /* Edit logic would go here, usually opening dialog */ }}>
                                            {/* For now, generic edit links to details page where edit exists, or we need to wrap CompanyDialog here */}
                                            <Pencil className="mr-2 h-4 w-4" /> Edit
                                        </DropdownMenuItem>
                                        <DeleteCompanyDialog
                                            id={vendor.id}
                                            name={vendor.name}
                                            type="Vendor"
                                            trigger={
                                                <div className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 text-destructive focus:text-destructive">
                                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                </div>
                                            }
                                        />
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
