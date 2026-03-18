"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateLibraryDoc } from "@/app/actions/library";

const CATEGORIES = ["General", "Process", "Quality", "Compliance", "Training", "Template", "Other"];

interface EditLibraryDocDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    doc: { id: string; title: string; description: string; category?: string | null };
    onSuccess: () => void;
}

export function EditLibraryDocDialog({ open, onOpenChange, doc, onSuccess }: EditLibraryDocDialogProps) {
    const router = useRouter();
    const [title, setTitle] = useState(doc.title);
    const [description, setDescription] = useState(doc.description);
    const [category, setCategory] = useState(doc.category || "General");
    const [saving, setSaving] = useState(false);

    async function handleSave() {
        if (!title.trim() || !description.trim()) return;
        setSaving(true);
        const res = await updateLibraryDoc(doc.id, {
            title: title.trim(),
            description: description.trim(),
            category,
        });
        if (res.success) {
            toast.success("Document updated.");
            onOpenChange(false);
            router.refresh();
            onSuccess();
        } else {
            toast.error(res.error || "Failed to update.");
        }
        setSaving(false);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Edit Document</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                    <div className="grid gap-1.5">
                        <Label>Title</Label>
                        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                    </div>
                    <div className="grid gap-1.5">
                        <Label>Description</Label>
                        <Textarea
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
                        onClick={handleSave}
                        disabled={saving || !title.trim() || !description.trim()}
                    >
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
