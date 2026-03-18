"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Upload, FileText } from "lucide-react";
import { toast } from "sonner";
import { createLibraryDoc } from "@/app/actions/library";

const CATEGORIES = ["General", "Process", "Quality", "Compliance", "Training", "Template", "Other"];

export function AddLibraryDocButton() {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("General");
    const fileInputRef = useRef<HTMLInputElement>(null);

    function reset() {
        setFile(null);
        setTitle("");
        setDescription("");
        setCategory("General");
        if (fileInputRef.current) fileInputRef.current.value = "";
    }

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const f = e.target.files?.[0] ?? null;
        setFile(f);
        if (f && !title) setTitle(f.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "));
    }

    async function handleSubmit() {
        if (!file) { toast.error("Please select a file."); return; }
        if (!title.trim()) { toast.error("Please enter a title."); return; }
        if (!description.trim()) { toast.error("Please enter a description."); return; }

        const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
        if (!["pdf", "doc", "docx"].includes(ext)) {
            toast.error("Only PDF or DOCX files are allowed.");
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
            const uploadJson = await uploadRes.json();
            if (!uploadJson.success) throw new Error(uploadJson.error || "Upload failed");

            const res = await createLibraryDoc({
                title: title.trim(),
                description: description.trim(),
                fileUrl: uploadJson.url,
                fileType: ext,
                category,
            });
            if (!res.success) throw new Error(res.error);

            toast.success("Document added to library.");
            reset();
            setOpen(false);
            router.refresh();
        } catch (err: any) {
            toast.error(err.message || "Something went wrong.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="h-4 w-4 mr-2" /> Add Document
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Add Document to Library</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 mt-2">
                    {/* File drop zone */}
                    <div className="grid gap-1.5">
                        <Label>File <span className="text-muted-foreground text-xs">(PDF or DOCX)</span></Label>
                        <div
                            className="flex items-center gap-3 border-2 border-dashed rounded-lg p-4 cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-colors bg-slate-50"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {file ? (
                                <>
                                    <FileText className="h-5 w-5 text-blue-500 shrink-0" />
                                    <span className="text-sm font-medium truncate">{file.name}</span>
                                </>
                            ) : (
                                <>
                                    <Upload className="h-5 w-5 text-muted-foreground shrink-0" />
                                    <span className="text-sm text-muted-foreground">Click to select a file…</span>
                                </>
                            )}
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.doc,.docx"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                    </div>

                    <div className="grid gap-1.5">
                        <Label>Title</Label>
                        <Input
                            placeholder="e.g. Onion Dehydration SOP"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    <div className="grid gap-1.5">
                        <Label>Description</Label>
                        <Textarea
                            placeholder="What is this document about? Who should use it and when?"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                        />
                    </div>

                    <div className="grid gap-1.5">
                        <Label>Category</Label>
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {CATEGORIES.map((c) => (
                                    <SelectItem key={c} value={c}>{c}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Button
                        className="w-full"
                        onClick={handleSubmit}
                        disabled={loading || !file || !title.trim() || !description.trim()}
                    >
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                        Add to Library
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
