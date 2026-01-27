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
    const [projectName, setProjectName] = useState("");

    useEffect(() => {
        // Always sync state with project prop when available, or reset when opening "New Project"
        if (project) {
            setProjectName(project.name);
            setSelectedCommodityId(project.commodityId || "");
        } else if (open) {
            setProjectName("");
            setSelectedCommodityId("");
        }
    }, [project, open]);

    // Auto-fill project name logic
    const handleCommodityChange = (val: string) => {
        setSelectedCommodityId(val);
        const comm = commodities.find(c => c.id === val);
        if (comm && !projectName && !project) {
            const suggestedName = `${comm.name} Sourcing`;
            setProjectName(suggestedName);
        }
    };

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        try {
            const name = formData.get("name") as string;
            const status = formData.get("status") as ProjectStatus;
            const id = formData.get("id") as string;

            if (!name) {
                toast.error("Project name is required");
                setLoading(false);
                return;
            }

            let result;
            if (id) {
                result = await updateProcurementProject(id, {
                    name,
                    status,
                    commodityId: selectedCommodityId || undefined
                });
            } else {
                result = await createProcurementProject({
                    name,
                    status: status || "SOURCING",
                    commodityId: selectedCommodityId || undefined
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
                            <Label htmlFor="commodity">Commodity</Label>
                            <Combobox
                                options={commodities.map(c => ({ label: c.name, value: c.id }))}
                                value={selectedCommodityId}
                                onChange={handleCommodityChange}
                                placeholder="Select commodity (Optional)"
                                searchPlaceholder="Search commodity..."
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="name">Project Name</Label>
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
                            <Label htmlFor="status">Status</Label>
                            <Select name="status" defaultValue={project?.status || "SOURCING"}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="SOURCING">Sourcing</SelectItem>
                                    <SelectItem value="COMPLETED">Completed</SelectItem>
                                </SelectContent>
                            </Select>
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
