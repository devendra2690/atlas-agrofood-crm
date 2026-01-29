"use client";

import { useState } from "react";
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
import { Combobox } from "@/components/ui/combobox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { createProcurementProject, updateProcurementProject } from "@/app/actions/procurement";
import { Plus, Pencil } from "lucide-react";
import { toast } from "sonner";
import { ProjectStatus } from "@prisma/client";
import { useEffect } from "react";

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
    const [type, setType] = useState<string>("PROJECT");
    const [projectName, setProjectName] = useState("");

    useEffect(() => {
        // Always sync state with project prop when available, or reset when opening "New Project"
        if (project) {
            setProjectName(project.name);
            setSelectedCommodityId(project.commodityId || "");
            setType(project.type || "PROJECT");
        } else if (open) {
            setProjectName("");
            setSelectedCommodityId("");
            setType("PROJECT");
        }
    }, [project, open]);

    // Auto-fill project name logic
    const updateProjectName = (currentType: string, commodityId: string) => {
        // Only auto-fill if creating new project (preserves manual edits on existing)
        if (project) return;

        const comm = commodities.find(c => c.id === commodityId);
        if (!comm) return;

        if (currentType === "PROJECT") {
            setProjectName(`Project (SOURCING) - ${comm.name} Sourcing`);
        } else if (currentType === "SAMPLE") {
            // Fallback or simple default for sample
            setProjectName(`${comm.name} Sample Request`);
        }
    };

    const handleCommodityChange = (val: string) => {
        setSelectedCommodityId(val);
        updateProjectName(type, val);
    };

    const handleTypeChange = (val: string) => {
        setType(val);
        updateProjectName(val, selectedCommodityId);
    };

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        try {
            const name = formData.get("name") as string;
            const status = formData.get("status") as ProjectStatus;
            const type = formData.get("type") as any; // Cast as needed or import Enum
            const id = formData.get("id") as string;

            if (!name) {
                toast.error("Project name is required");
                setLoading(false);
                return;
            }

            if (!selectedCommodityId) {
                toast.error("Commodity is required");
                setLoading(false);
                return;
            }

            if (!status) {
                toast.error("Status is required");
                setLoading(false);
                return;
            }

            let result;
            if (id) {
                result = await updateProcurementProject(id, {
                    name,
                    status,
                    type,
                    commodityId: selectedCommodityId
                });
            } else {
                result = await createProcurementProject({
                    name,
                    status: status,
                    type: type,
                    commodityId: selectedCommodityId
                });
            }

            if (result.success) {
                toast.success(id ? "Project updated successfully" : "Project created successfully");
                setOpen(false);
                if (!id) {
                    setProjectName("");
                    setSelectedCommodityId("");
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
            <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{project ? "Edit Sourcing Project" : "New Sourcing Project"}</DialogTitle>
                    <DialogDescription>
                        {project ? "Update project details." : "Create a project to track sourcing for a commodity or requirement."}
                    </DialogDescription>
                </DialogHeader>
                <form action={handleSubmit}>
                    <input type="hidden" name="id" value={project?.id || ""} />
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="commodity">Commodity <span className="text-red-500">*</span></Label>
                            <Combobox
                                options={commodities.map(c => ({ label: c.name, value: c.id }))}
                                value={selectedCommodityId}
                                onChange={handleCommodityChange}
                                placeholder="Select commodity"
                                searchPlaceholder="Search commodity..."
                            />
                        </div>
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
                        <div className="grid gap-2">
                            <Label htmlFor="status">Status <span className="text-red-500">*</span></Label>
                            <Select name="status" defaultValue={project?.status || "SOURCING"} required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="SOURCING">Sourcing</SelectItem>
                                    <SelectItem value="COMPLETED">Completed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {/* Warnings/Help based on type */}
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
