"use client";

import { useState, useEffect, useRef } from "react";
import {
    Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    Loader2, Plus, Trash2, Settings2, Tag, BookOpen, FileText, Download,
} from "lucide-react";
import { toast } from "sonner";
import {
    updateCommodity,
    addCommodityForm, deleteVarietyForm,
    getCommodityVarieties, createCommodityVariety, deleteCommodityVariety,
    getProcessDocuments, createProcessDocument, deleteProcessDocument,
} from "@/app/actions/commodity";
import { VarietyConfigDialog } from "./variety-config-dialog";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Link from "next/link";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Commodity {
    id: string;
    name: string;
    yieldPercentage: number;
    wastagePercentage: number;
    category?: string;
    baseBatchElectricityUnits?: number;
    forms?: { id: string; formName: string; yieldPercentage: number; wastagePercentage: number; formElectricityMultiplier: number }[];
    documentTemplate?: any;
}

interface CommodityManageSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    commodity: Commodity;
    allCommodities: { id: string; name: string; documentTemplate?: any }[];
    onSuccess: () => void;
}

const FORM_OPTIONS = ["Powder", "Flakes", "Chips", "Granules", "Paste", "Dehydrated"];
const CATEGORIES = ["Other", "Fruit", "Leafy", "Bulb"];

// ─── Overview Tab ────────────────────────────────────────────────────────────

function OverviewTab({ commodity, onSuccess }: { commodity: Commodity; onSuccess: () => void }) {
    const [name, setName] = useState(commodity.name);
    const [yieldPct, setYieldPct] = useState(commodity.yieldPercentage.toString());
    const [wastagePct, setWastagePct] = useState((commodity.wastagePercentage || 0).toString());
    const [category, setCategory] = useState(commodity.category || "Other");
    const [energyUnits, setEnergyUnits] = useState((commodity.baseBatchElectricityUnits || 0).toString());
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!name.trim()) return;
        setSaving(true);
        const res = await updateCommodity(
            commodity.id, name,
            parseFloat(yieldPct) || 0,
            parseFloat(wastagePct) || 0,
            undefined, category,
            parseFloat(energyUnits) || 0,
        );
        if (res.success) {
            toast.success("Commodity updated");
            onSuccess();
        } else {
            toast.error("Failed to update commodity");
        }
        setSaving(false);
    };

    return (
        <div className="space-y-4 py-2">
            <div className="grid gap-1.5">
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
                <div className="grid gap-1.5">
                    <Label>Yield %</Label>
                    <Input type="number" value={yieldPct} onChange={(e) => setYieldPct(e.target.value)} />
                </div>
                <div className="grid gap-1.5">
                    <Label>Wastage %</Label>
                    <Input type="number" value={wastagePct} onChange={(e) => setWastagePct(e.target.value)} />
                </div>
                <div className="grid gap-1.5">
                    <Label title="Base Batch Electricity Units">Base Energy (KWh)</Label>
                    <Input type="number" value={energyUnits} onChange={(e) => setEnergyUnits(e.target.value)} />
                </div>
            </div>
            <div className="flex items-center gap-2 pt-2">
                <Button onClick={handleSave} disabled={saving || !name.trim()}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>
                <Link href={`/documents/commodity/${commodity.id}`} target="_blank">
                    <Button variant="outline" size="sm">
                        <FileText className="h-4 w-4 mr-1" /> Print Document
                    </Button>
                </Link>
            </div>
        </div>
    );
}

// ─── Base Forms Tab ──────────────────────────────────────────────────────────

function BaseFormsTab({ commodity, onSuccess }: { commodity: Commodity; onSuccess: () => void }) {
    const effectiveYield = commodity.yieldPercentage;
    const effectiveWastage = commodity.wastagePercentage || 0;

    const [newFormName, setNewFormName] = useState("");
    const [newYield, setNewYield] = useState(effectiveYield.toString());
    const [newWastage, setNewWastage] = useState(effectiveWastage.toString());
    const [newMultiplier, setNewMultiplier] = useState("0");
    const [creating, setCreating] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);

    const formsList = commodity.forms || [];
    const available = FORM_OPTIONS.filter((o) => !formsList.some((f) => f.formName === o));

    const handleCreate = async () => {
        if (!newFormName.trim()) return;
        setCreating(true);
        const res = await addCommodityForm(
            commodity.id, newFormName,
            parseFloat(newYield) || 100,
            parseFloat(newWastage) || 0,
            parseFloat(newMultiplier) || 0,
        );
        if (res.success) {
            toast.success("Form added");
            setNewFormName("");
            setNewYield(effectiveYield.toString());
            setNewWastage(effectiveWastage.toString());
            setNewMultiplier("0");
            onSuccess();
        } else {
            toast.error("Failed to add form");
        }
        setCreating(false);
    };

    const handleDelete = async (id: string) => {
        setDeleting(id);
        const res = await deleteVarietyForm(id);
        if (res.success) {
            toast.success("Form deleted");
            onSuccess();
        } else {
            toast.error("Failed to delete form");
        }
        setDeleting(null);
    };

    return (
        <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
                Define yield, wastage, and energy multiplier per product form.
            </p>

            {/* Add form row */}
            <div className="grid grid-cols-12 gap-2 items-end border rounded-lg p-3 bg-slate-50">
                <div className="col-span-4">
                    <Label className="text-xs mb-1 block">Form Name</Label>
                    <Select value={newFormName} onValueChange={setNewFormName}>
                        <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                        <SelectContent>
                            {available.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="col-span-2">
                    <Label className="text-xs mb-1 block">Yield %</Label>
                    <Input type="number" value={newYield} onChange={(e) => setNewYield(e.target.value)} />
                </div>
                <div className="col-span-2">
                    <Label className="text-xs mb-1 block">Wastage %</Label>
                    <Input type="number" value={newWastage} onChange={(e) => setNewWastage(e.target.value)} />
                </div>
                <div className="col-span-3">
                    <Label className="text-xs mb-1 block">KWh / Kg</Label>
                    <Input type="number" step="0.01" value={newMultiplier} onChange={(e) => setNewMultiplier(e.target.value)} />
                </div>
                <div className="col-span-1">
                    <Button size="icon" onClick={handleCreate} disabled={creating || !newFormName}>
                        {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    </Button>
                </div>
            </div>

            {/* List */}
            <div className="space-y-2 max-h-[360px] overflow-y-auto">
                {formsList.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground py-8">No base forms configured.</p>
                ) : (
                    formsList.map((form) => (
                        <div key={form.id} className="grid grid-cols-12 gap-2 items-center bg-white border rounded-md p-2.5">
                            <div className="col-span-4 font-medium text-sm">{form.formName}</div>
                            <div className="col-span-2 text-xs text-muted-foreground">
                                Yield: {form.yieldPercentage > 0 ? form.yieldPercentage : effectiveYield}%
                            </div>
                            <div className="col-span-2 text-xs text-muted-foreground">
                                Waste: {form.wastagePercentage > 0 ? form.wastagePercentage : effectiveWastage}%
                            </div>
                            <div className="col-span-3 text-xs font-semibold text-blue-600">
                                {form.formElectricityMultiplier > 0 ? `+${form.formElectricityMultiplier} KWh` : "—"}
                            </div>
                            <div className="col-span-1 flex justify-end">
                                <Button
                                    variant="ghost" size="icon"
                                    className="h-7 w-7 text-red-500 hover:bg-red-50"
                                    onClick={() => handleDelete(form.id)}
                                    disabled={deleting === form.id}
                                >
                                    {deleting === form.id
                                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        : <Trash2 className="h-3.5 w-3.5" />}
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

// ─── Varieties Tab ───────────────────────────────────────────────────────────

function VarietiesTab({ commodity }: { commodity: Commodity }) {
    const [varieties, setVarieties] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [newVariety, setNewVariety] = useState("");
    const [newYield, setNewYield] = useState(commodity.yieldPercentage.toString());
    const [newWastage, setNewWastage] = useState((commodity.wastagePercentage || 0).toString());
    const [creating, setCreating] = useState(false);
    const [configOpen, setConfigOpen] = useState(false);
    const [selectedVariety, setSelectedVariety] = useState<any>(null);

    const load = async () => {
        setLoading(true);
        const res = await getCommodityVarieties(commodity.id);
        if (res.success && res.data) setVarieties(res.data);
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const handleCreate = async () => {
        if (!newVariety.trim()) return;
        setCreating(true);
        const res = await createCommodityVariety(
            commodity.id, newVariety,
            parseFloat(newYield) || 100,
            parseFloat(newWastage) || 0,
        );
        if (res.success) {
            toast.success("Variety added");
            setNewVariety("");
            setNewYield(commodity.yieldPercentage.toString());
            setNewWastage((commodity.wastagePercentage || 0).toString());
            load();
        } else {
            toast.error("Failed to add variety");
        }
        setCreating(false);
    };

    const handleDelete = async (id: string) => {
        const res = await deleteCommodityVariety(id);
        if (res.success) {
            toast.success("Variety removed");
            load();
        } else {
            toast.error("Failed to remove variety");
        }
    };

    return (
        <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
                Add specific varieties and configure their forms separately.
            </p>

            {/* Add variety row */}
            <div className="flex gap-2 items-end border rounded-lg p-3 bg-slate-50">
                <div className="flex-1">
                    <Label className="text-xs mb-1 block">Variety Name</Label>
                    <Input
                        placeholder="e.g. Red Onion"
                        value={newVariety}
                        onChange={(e) => setNewVariety(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                    />
                </div>
                <div className="w-[90px]">
                    <Label className="text-xs mb-1 block">Yield %</Label>
                    <Input type="number" value={newYield} onChange={(e) => setNewYield(e.target.value)} />
                </div>
                <div className="w-[90px]">
                    <Label className="text-xs mb-1 block">Wastage %</Label>
                    <Input type="number" value={newWastage} onChange={(e) => setNewWastage(e.target.value)} />
                </div>
                <Button onClick={handleCreate} disabled={creating || !newVariety.trim()}>
                    {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                </Button>
            </div>

            {/* List */}
            <div className="space-y-2 max-h-[360px] overflow-y-auto">
                {loading ? (
                    <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                ) : varieties.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground py-8">No varieties added yet.</p>
                ) : (
                    varieties.map((v) => (
                        <div key={v.id} className="flex items-center justify-between bg-white border rounded-md p-2.5">
                            <div>
                                <p className="text-sm font-medium">{v.name}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-xs text-muted-foreground">
                                        Yield: {v.yieldPercentage || commodity.yieldPercentage}%
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        Wastage: {v.wastagePercentage || commodity.wastagePercentage || 0}%
                                    </span>
                                    {v.forms?.length > 0 && (
                                        <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                                            {v.forms.length} forms
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost" size="sm"
                                    onClick={() => { setSelectedVariety(v); setConfigOpen(true); }}
                                    title="Configure Forms"
                                >
                                    <Settings2 className="h-4 w-4" />
                                </Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="sm">
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Delete variety?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will remove "{v.name}" and all its forms permanently.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={() => handleDelete(v.id)}
                                                className="bg-red-600 hover:bg-red-700 text-white"
                                            >
                                                Delete
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {selectedVariety && (
                <VarietyConfigDialog
                    open={configOpen}
                    onOpenChange={setConfigOpen}
                    variety={selectedVariety}
                    commodityYield={commodity.yieldPercentage}
                    commodityWastage={commodity.wastagePercentage || 0}
                    onSuccess={load}
                />
            )}
        </div>
    );
}

// ─── Guides Tab ──────────────────────────────────────────────────────────────

type ProcessDoc = {
    id: string;
    title: string;
    description?: string | null;
    fileUrl: string;
    fileType: string;
    form?: { id: string; formName: string } | null;
};

function GuidesTab({ commodity }: { commodity: Commodity }) {
    const [docs, setDocs] = useState<ProcessDoc[]>([]);
    const [fetching, setFetching] = useState(true);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [selectedFormId, setSelectedFormId] = useState("none");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const load = async () => {
        setFetching(true);
        const res = await getProcessDocuments(commodity.id);
        if (res.success && res.data) setDocs(res.data as ProcessDoc[]);
        setFetching(false);
    };

    useEffect(() => { load(); }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        setSelectedFile(file);
        if (file && !title) setTitle(file.name.replace(/\.[^/.]+$/, ""));
    };

    const handleUpload = async () => {
        if (!selectedFile || !title.trim()) {
            toast.error("Please select a file and enter a title.");
            return;
        }
        const ext = selectedFile.name.split(".").pop()?.toLowerCase();
        if (!["pdf", "docx", "doc"].includes(ext ?? "")) {
            toast.error("Only PDF or DOCX files are allowed.");
            return;
        }
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", selectedFile);
            const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
            const uploadData = await uploadRes.json();
            if (!uploadData.success) throw new Error(uploadData.error || "Upload failed");

            const res = await createProcessDocument({
                title: title.trim(),
                description: description.trim() || undefined,
                fileUrl: uploadData.url,
                fileType: ext === "pdf" ? "pdf" : "docx",
                commodityId: commodity.id,
                formId: selectedFormId !== "none" ? selectedFormId : undefined,
            });
            if (!res.success) throw new Error(res.error);

            toast.success("Guide uploaded.");
            setTitle(""); setDescription(""); setSelectedFormId("none"); setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
            load();
        } catch (err: any) {
            toast.error(err.message || "Failed to upload guide.");
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        const res = await deleteProcessDocument(id);
        if (res.success) {
            toast.success("Guide deleted.");
            setDocs((prev) => prev.filter((d) => d.id !== id));
        } else {
            toast.error("Failed to delete guide.");
        }
    };

    return (
        <div className="space-y-4 py-2">
            {/* Upload */}
            <div className="border rounded-lg p-3 bg-slate-50 space-y-3">
                <p className="text-sm font-medium">Upload New Guide</p>
                <div className="grid gap-1.5">
                    <Label className="text-xs">File (PDF or DOCX)</Label>
                    <Input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-1.5">
                        <Label className="text-xs">Title</Label>
                        <Input placeholder="Guide title" value={title} onChange={(e) => setTitle(e.target.value)} />
                    </div>
                    <div className="grid gap-1.5">
                        <Label className="text-xs">Description (optional)</Label>
                        <Input placeholder="Brief description" value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>
                </div>
                {commodity.forms && commodity.forms.length > 0 && (
                    <div className="grid gap-1.5">
                        <Label className="text-xs">Specific Form (optional)</Label>
                        <Select value={selectedFormId} onValueChange={setSelectedFormId}>
                            <SelectTrigger><SelectValue placeholder="All forms / General" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">All forms / General</SelectItem>
                                {commodity.forms.map((f) => (
                                    <SelectItem key={f.id} value={f.id}>{f.formName}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
                <Button onClick={handleUpload} disabled={uploading || !selectedFile || !title.trim()} size="sm">
                    {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                    Upload Guide
                </Button>
            </div>

            {/* List */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {fetching ? (
                    <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                ) : docs.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground py-6">No guides uploaded yet.</p>
                ) : (
                    docs.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between bg-white border rounded-md p-2.5">
                            <div className="flex items-center gap-2 min-w-0">
                                <FileText className="h-4 w-4 text-blue-500 shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-sm font-medium truncate">{doc.title}</p>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-xs text-muted-foreground uppercase">{doc.fileType}</span>
                                        {doc.form && (
                                            <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100">
                                                {doc.form.formName}
                                            </span>
                                        )}
                                        {doc.description && (
                                            <span className="text-xs text-muted-foreground truncate">{doc.description}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                                    <Button variant="ghost" size="sm"><Download className="h-4 w-4" /></Button>
                                </a>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="sm">
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Delete guide?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will permanently remove "{doc.title}".
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={() => handleDelete(doc.id)}
                                                className="bg-red-600 hover:bg-red-700 text-white"
                                            >
                                                Delete
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

// ─── Main Sheet ──────────────────────────────────────────────────────────────

export function CommodityManageSheet({
    open, onOpenChange, commodity, allCommodities, onSuccess,
}: CommodityManageSheetProps) {
    const categoryColors: Record<string, string> = {
        Fruit: "bg-orange-50 text-orange-700 border-orange-200",
        Leafy: "bg-green-50 text-green-700 border-green-200",
        Bulb: "bg-purple-50 text-purple-700 border-purple-200",
        Other: "bg-slate-100 text-slate-600 border-slate-200",
    };
    const cat = commodity.category || "Other";

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full sm:max-w-2xl flex flex-col p-0">
                {/* Header */}
                <SheetHeader className="px-6 pt-6 pb-4 border-b">
                    <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                            <SheetTitle className="text-xl">{commodity.name}</SheetTitle>
                            <SheetDescription className="mt-1 flex items-center gap-2">
                                <span className={`text-xs px-2 py-0.5 rounded border font-medium ${categoryColors[cat]}`}>
                                    {cat}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    Yield {commodity.yieldPercentage}% · Wastage {commodity.wastagePercentage || 0}%
                                </span>
                                {(commodity.baseBatchElectricityUnits || 0) > 0 && (
                                    <span className="text-xs text-blue-600">
                                        {commodity.baseBatchElectricityUnits} KWh base
                                    </span>
                                )}
                            </SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                {/* Tabs */}
                <div className="flex-1 overflow-y-auto px-6 pb-6">
                    <Tabs defaultValue="overview" className="mt-4">
                        <TabsList className="grid grid-cols-4 w-full">
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="forms">
                                Base Forms
                                {(commodity.forms?.length ?? 0) > 0 && (
                                    <span className="ml-1.5 text-xs bg-slate-200 text-slate-600 rounded-full px-1.5">
                                        {commodity.forms!.length}
                                    </span>
                                )}
                            </TabsTrigger>
                            <TabsTrigger value="varieties">Varieties</TabsTrigger>
                            <TabsTrigger value="guides">
                                <BookOpen className="h-3.5 w-3.5 mr-1" /> Guides
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview">
                            <OverviewTab commodity={commodity} onSuccess={onSuccess} />
                        </TabsContent>

                        <TabsContent value="forms">
                            <BaseFormsTab commodity={commodity} onSuccess={onSuccess} />
                        </TabsContent>

                        <TabsContent value="varieties">
                            <VarietiesTab commodity={commodity} />
                        </TabsContent>

                        <TabsContent value="guides">
                            <GuidesTab commodity={commodity} />
                        </TabsContent>
                    </Tabs>
                </div>
            </SheetContent>
        </Sheet>
    );
}
