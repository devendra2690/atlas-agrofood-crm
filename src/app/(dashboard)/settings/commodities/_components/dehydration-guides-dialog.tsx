"use client";

import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Trash2, FileText, Download, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getProcessDocuments, createProcessDocument, deleteProcessDocument } from "@/app/actions/commodity";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface DehydrationGuidesDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    commodity: {
        id: string;
        name: string;
        forms?: { id: string; formName: string }[];
    };
}

type ProcessDoc = {
    id: string;
    title: string;
    description?: string | null;
    fileUrl: string;
    fileType: string;
    formId?: string | null;
    form?: { id: string; formName: string } | null;
    createdAt: string | Date;
};

export function DehydrationGuidesDialog({ open, onOpenChange, commodity }: DehydrationGuidesDialogProps) {
    const [docs, setDocs] = useState<ProcessDoc[]>([]);
    const [fetching, setFetching] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [selectedFormId, setSelectedFormId] = useState<string>("none");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    async function loadDocs() {
        setFetching(true);
        const res = await getProcessDocuments(commodity.id);
        if (res.success && res.data) {
            setDocs(res.data as ProcessDoc[]);
        }
        setFetching(false);
    }

    useEffect(() => {
        if (open) loadDocs();
    }, [open]);

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0] ?? null;
        setSelectedFile(file);
        if (file && !title) {
            setTitle(file.name.replace(/\.[^/.]+$/, ""));
        }
    }

    async function handleUpload() {
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

            toast.success("Guide uploaded successfully.");
            setTitle("");
            setDescription("");
            setSelectedFormId("none");
            setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
            loadDocs();
        } catch (err: any) {
            toast.error(err.message || "Failed to upload guide.");
        } finally {
            setUploading(false);
        }
    }

    async function handleDelete(id: string) {
        const res = await deleteProcessDocument(id);
        if (res.success) {
            toast.success("Guide deleted.");
            setDocs((prev) => prev.filter((d) => d.id !== id));
        } else {
            toast.error("Failed to delete guide.");
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        Dehydration Guides — {commodity.name}
                    </DialogTitle>
                </DialogHeader>

                {/* Upload section */}
                <div className="border rounded-lg p-4 space-y-3 bg-slate-50">
                    <p className="text-sm font-medium">Upload New Guide</p>
                    <div className="grid gap-2">
                        <Label className="text-xs">File (PDF or DOCX)</Label>
                        <Input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={handleFileChange}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label className="text-xs">Title</Label>
                        <Input
                            placeholder="e.g. Banana Dehydration Process Guide"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label className="text-xs">Description (optional)</Label>
                        <Input
                            placeholder="Brief description of this guide"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                    {commodity.forms && commodity.forms.length > 0 && (
                        <div className="grid gap-2">
                            <Label className="text-xs">Specific Form (optional)</Label>
                            <Select value={selectedFormId} onValueChange={setSelectedFormId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All forms / General" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">All forms / General</SelectItem>
                                    {commodity.forms.map((f) => (
                                        <SelectItem key={f.id} value={f.id}>
                                            {f.formName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    <Button
                        onClick={handleUpload}
                        disabled={uploading || !selectedFile || !title.trim()}
                        size="sm"
                    >
                        {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                        Upload Guide
                    </Button>
                </div>

                {/* Existing guides */}
                <div className="space-y-2">
                    <p className="text-sm font-medium">Existing Guides</p>
                    {fetching ? (
                        <div className="flex justify-center py-6">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : docs.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            No guides uploaded yet.
                        </p>
                    ) : (
                        docs.map((doc) => (
                            <div
                                key={doc.id}
                                className="flex items-center justify-between p-3 border rounded-md bg-white"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <FileText className="h-5 w-5 text-blue-500 shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium truncate">{doc.title}</p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-muted-foreground uppercase">
                                                {doc.fileType}
                                            </span>
                                            {doc.form && (
                                                <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100">
                                                    {doc.form.formName}
                                                </span>
                                            )}
                                            {doc.description && (
                                                <span className="text-xs text-muted-foreground truncate">
                                                    {doc.description}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                                        <Button variant="ghost" size="sm">
                                            <Download className="h-4 w-4" />
                                        </Button>
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
                                                    This will remove "{doc.title}" permanently.
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
            </DialogContent>
        </Dialog>
    );
}
