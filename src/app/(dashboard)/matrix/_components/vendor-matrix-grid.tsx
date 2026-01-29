"use client";

import { useEffect, useState } from "react";
import { getVendorMatrix, getMatrixAuxData } from "@/app/actions/matrix";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit2, Loader2, Trash2, Box, Truck } from "lucide-react";
import { ManageVendorVarietyDialog } from "./manage-vendor-variety-dialog";
import { manageVendorVariety } from "@/app/actions/matrix";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export function VendorMatrixGrid() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Aux data
    const [vendors, setVendors] = useState<any[]>([]);
    const [varieties, setVarieties] = useState<any[]>([]);
    const [states, setStates] = useState<any[]>([]);

    // Filters
    const [commodityFilter, setCommodityFilter] = useState("all");

    // Extract unique commodities for filter
    const uniqueCommodities = Array.from(new Set(varieties.map(v => v.commodity.name)));

    const loadData = async () => {
        setLoading(true);
        // Load aux data first if empty
        if (vendors.length === 0) {
            const aux = await getMatrixAuxData();
            if (aux.success && aux.data) {
                setVendors(aux.data.vendors);
                setVarieties(aux.data.varieties);
                setStates(aux.data.states);
            }
        }

        const res = await getVendorMatrix();
        if (res.success && res.data) {
            setData(res.data);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to remove this capability?")) return;
        const res = await manageVendorVariety("DELETE", { id } as any);
        if (res.success) {
            toast.success("Removed");
            loadData();
        }
    };

    const filteredData = commodityFilter === "all"
        ? data
        : data.filter(item => item.variety.commodity.name === commodityFilter);

    if (loading && vendors.length === 0) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Label>Filter by Commodity:</Label>
                    <Select value={commodityFilter} onValueChange={setCommodityFilter}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="All Commodities" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Commodities</SelectItem>
                            {uniqueCommodities.map(c => (
                                <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex gap-2">
                    <Button variant="outline" onClick={loadData} disabled={loading}>
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
                    </Button>
                    <ManageVendorVarietyDialog
                        vendors={vendors}
                        varieties={varieties}
                        states={states}
                        trigger={
                            <Button>
                                <Box className="h-4 w-4 mr-2" />
                                Add Capability
                            </Button>
                        }
                    />
                </div>
            </div>

            <div className="border rounded-lg bg-white overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead>Vendor</TableHead>
                            <TableHead>Commodity / Variety</TableHead>
                            <TableHead>Origin</TableHead>
                            <TableHead>Lead Time</TableHead>
                            <TableHead>Capacity</TableHead>
                            <TableHead>Grade</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredData.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                                    <div className="flex flex-col items-center gap-2">
                                        <Truck className="h-10 w-10 text-slate-200" />
                                        <p>No mappings found matching your criteria.</p>
                                        <p className="text-xs">Add vendor capabilities to populate the matrix.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                        {filteredData.map((item) => (
                            <TableRow key={item.id} className={item.isBlacklisted ? "bg-red-50 hover:bg-red-100" : "hover:bg-slate-50"}>
                                <TableCell className="font-medium text-slate-900">{item.vendor.name}</TableCell>
                                <TableCell>
                                    <div className="font-medium text-slate-800">{item.variety.name}</div>
                                    <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground mt-0.5">
                                        {item.variety.commodity.name}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {item.originState ? (
                                        <div className="flex items-center gap-1.5">
                                            <span className="h-2 w-2 rounded-full bg-blue-400"></span>
                                            {item.originState.name}
                                        </div>
                                    ) : (
                                        <span className="text-muted-foreground">-</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-sm">{item.leadTime || "-"}</TableCell>
                                <TableCell className="text-sm">{item.supplyCapacity || "-"}</TableCell>
                                <TableCell>
                                    {item.qualityGrade && (
                                        <Badge variant="secondary" className="bg-slate-100">{item.qualityGrade}</Badge>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {item.isBlacklisted ? (
                                        <Badge variant="destructive">Blacklisted</Badge>
                                    ) : (
                                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-1">
                                        <ManageVendorVarietyDialog
                                            existingData={item}
                                            vendors={vendors}
                                            varieties={varieties}
                                            states={states}
                                            trigger={
                                                <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600">
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                            }
                                        />
                                        <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-red-50 hover:text-destructive" onClick={() => handleDelete(item.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
