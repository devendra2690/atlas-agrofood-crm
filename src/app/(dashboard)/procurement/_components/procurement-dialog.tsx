"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Combobox } from "@/components/ui/combobox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { createProcurementProject, updateProcurementProject } from "@/app/actions/procurement";
import { getCommodityVarieties } from "@/app/actions/commodity";
import { Plus, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { ProjectStatus } from "@prisma/client";

interface Commodity {
    id: string;
    name: string;
}

interface ProcurementDialogProps {
    commodities?: Commodity[];
    project?: any;
    trigger?: React.ReactNode;
}

export function ProcurementDialog({ commodities = [], project, trigger }: ProcurementDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedCommodityId, setSelectedCommodityId] = useState<string>("");
    const [selectedVarietyId, setSelectedVarietyId] = useState<string>("");
    const [varieties, setVarieties] = useState<any[]>([]);
    const [type, setType] = useState<string>("PROJECT");
    const [projectName, setProjectName] = useState("");

    // Additional commodities (multi-select)
    const [additionalCommodityIds, setAdditionalCommodityIds] = useState<string[]>([]);
    const [addingCommodity, setAddingCommodity] = useState<string>("");

    useEffect(() => {
        if (project) {
            setProjectName(project.name);
            setSelectedCommodityId(project.commodityId || "");
            setSelectedVarietyId(project.varietyId || "");
            setType(project.type || "PROJECT");
            // Pre-populate additional commodities from join table
            const existing = (project.additionalCommodities || []).map((pc: any) => pc.commodityId);
            setAdditionalCommodityIds(existing);
        } else if (open) {
            setProjectName("");
            setSelectedCommodityId("");
            setSelectedVarietyId("");
            setType("PROJECT");
            setAdditionalCommodityIds([]);
        }
    }, [project, open]);

    // Fetch Varieties for primary commodity
    useEffect(() => {
        if (selectedCommodityId) {
            getCommodityVarieties(selectedCommodityId).then(res => {
                setVarieties(res.success && res.data ? res.data : []);
            });
        } else {
            setVarieties([]);
        }
    }, [selectedCommodityId]);

    const updateProjectName = (currentType: string, commodityId: string) => {
        if (project) return;
        const comm = commodities.find(c => c.id === commodityId);
        if (!comm) return;
        if (currentType === "PROJECT") {
            const varietyName = varieties.find(v => v.id === selectedVarietyId)?.name;
            setProjectName(`Project (SOURCING) - ${comm.name}${varietyName ? ` (${varietyName})` : ''} Sourcing`);
        } else if (currentType === "SAMPLE") {
            setProjectName(`${comm.name} Sample Request`);
        }
    };

    const handleCommodityChange = (val: string) => {
        setSelectedCommodityId(val);
        setSelectedVarietyId("");
        updateProjectName(type, val);
        // Remove from additionals if it was there
        setAdditionalCommodityIds(prev => prev.filter(id => id !== val));
    };

    const handleTypeChange = (val: string) => {
        setType(val);
        updateProjectName(val, selectedCommodityId);
    };

    // Additional commodity helpers
    const addAdditionalCommodity = (commodityId: string) => {
        if (!commodityId || commodityId === selectedCommodityId) return;
        if (additionalCommodityIds.includes(commodityId)) return;
        setAdditionalCommodityIds(prev => [...prev, commodityId]);
        setAddingCommodity("");
    };

    const removeAdditionalCommodity = (commodityId: string) => {
        setAdditionalCommodityIds(prev => prev.filter(id => id !== commodityId));
    };

    // Commodities available for additional selection (exclude primary + already selected)
    const availableForAdditional = commodities.filter(
        c => c.id !== selectedCommodityId && !additionalCommodityIds.includes(c.id)
    );

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        try {
            const name = formData.get("name") as string;
            const status = formData.get("status") as ProjectStatus;
            const type = formData.get("type") as any;
            const id = formData.get("id") as string;

            if (!name) { toast.error("Project name is required"); setLoading(false); return; }
            if (!selectedCommodityId) { toast.error("Primary commodity is required"); setLoading(false); return; }
            if (!status) { toast.error("Status is required"); setLoading(false); return; }

            let result;
            if (id) {
                result = await updateProcurementProject(id, {
                    name, status, type,
                    commodityId: selectedCommodityId,
                    varietyId: selectedVarietyId || undefined,
                    additionalCommodityIds
                });
            } else {
                result = await createProcurementProject({
                    name, status, type,
                    commodityId: selectedCommodityId,
                    additionalCommodityIds
                });
            }

            if (result.success) {
                toast.success(id ? "Project updated successfully" : "Project created successfully");
                setOpen(false);
                if (!id) {
                    setProjectName("");
                    setSelectedCommodityId("");
                    setSelectedVarietyId("");
                    setAdditionalCommodityIds([]);
                }
            } else {
                toast.error(result.error || "Failed to save project");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        New Project
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{project ? "Edit Sourcing Project" : "New Sourcing Project"}</DialogTitle>
                    <DialogDescription>
                        {project ? "Update project details." : "Create a project to track sourcing for a commodity or requirement."}
                    </DialogDescription>
                </DialogHeader>
                <form action={handleSubmit}>
                    <input type="hidden" name="id" value={project?.id || ""} />
                    <div className="grid gap-4 py-4">

                        {/* Primary Commodity */}
                        <div className="grid gap-2">
                            <Label htmlFor="commodity">Primary Commodity <span className="text-red-500">*</span></Label>
                            <Combobox
                                options={commodities.map(c => ({ label: c.name, value: c.id }))}
                                value={selectedCommodityId}
                                onChange={handleCommodityChange}
                                placeholder="Select commodity"
                                searchPlaceholder="Search commodity..."
                            />
                        </div>

                        {/* Variety Selection */}
                        {varieties.length > 0 && (
                            <div className="grid gap-2">
                                <Label htmlFor="variety">Variety (Optional)</Label>
                                <Combobox
                                    options={varieties.map(v => ({ label: v.name, value: v.id }))}
                                    value={selectedVarietyId}
                                    onChange={val => setSelectedVarietyId(val)}
                                    placeholder="Select variety..."
                                    searchPlaceholder="Search variety..."
                                    emptyMessage="No varieties found"
                                />
                            </div>
                        )}

                        {/* Additional Commodities */}
                        <div className="grid gap-2">
                            <Label>Additional Commodities <span className="text-xs text-muted-foreground">(optional)</span></Label>

                            {/* Selected additional commodities as chips */}
                            {additionalCommodityIds.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mb-1">
                                    {additionalCommodityIds.map(id => {
                                        const comm = commodities.find(c => c.id === id);
                                        return (
                                            <Badge key={id} variant="secondary" className="gap-1 pr-1">
                                                {comm?.name || id}
                                                <button
                                                    type="button"
                                                    onClick={() => removeAdditionalCommodity(id)}
                                                    className="ml-0.5 rounded-full hover:bg-slate-200 p-0.5"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </Badge>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Add another commodity */}
                            {availableForAdditional.length > 0 && (
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <Combobox
                                            options={availableForAdditional.map(c => ({ label: c.name, value: c.id }))}
                                            value={addingCommodity}
                                            onChange={val => { setAddingCommodity(val); addAdditionalCommodity(val); }}
                                            placeholder="+ Add another commodity..."
                                            searchPlaceholder="Search..."
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Project Name */}
                        <div className="grid gap-2">
                            <Label htmlFor="name">Project Name <span className="text-red-500">*</span></Label>
                            <Input
                                id="name"
                                name="name"
                                placeholder="e.g. Banana Powder Q1 2026"
                                value={projectName}
                                onChange={(e) => setProjectName(e.target.value)}
                                required
                            />
                        </div>

                        {/* Type */}
                        <div className="grid gap-2">
                            <Label htmlFor="type">Type <span className="text-red-500">*</span></Label>
                            <Select name="type" value={type} onValueChange={handleTypeChange} required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PROJECT">Project (Sourcing)</SelectItem>
                                    <SelectItem value="SAMPLE">Sample Only</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Status */}
                        <div className="grid gap-2">
                            <Label htmlFor="status">Status <span className="text-red-500">*</span></Label>
                            <Select name="status" defaultValue={project?.status || "SOURCING"} required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="SOURCING">Sourcing</SelectItem>
                                    <SelectItem value="COMPLETED">Completed</SelectItem>
                                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="text-[10px] text-muted-foreground bg-slate-50 p-2 rounded">
                            <p><strong>Project:</strong> Tracks sourcing for a Sales Opportunity (1 Opp).</p>
                            <p><strong>Sample Only:</strong> Internal sample testing without linked opportunity.</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Saving..." : (project ? "Save Changes" : "Create Project")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
