"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Link as LinkIcon, Download, Trash, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateOpportunityPoUrl } from "@/app/actions/opportunity";

interface OpportunityPoAttachmentProps {
    opportunityId: string;
    initialUrl?: string | null;
}

export function OpportunityPoAttachment({ opportunityId, initialUrl }: OpportunityPoAttachmentProps) {
    const [url, setUrl] = useState(initialUrl || "");
    const [isEditing, setIsEditing] = useState(!initialUrl);
    const [loading, setLoading] = useState(false);

    const handleRemove = async () => {
        if (!confirm("Are you sure you want to remove this attached PO?")) return;
        setLoading(true);
        try {
            const result = await updateOpportunityPoUrl(opportunityId, null);
            if (result.success) {
                toast.success("Attached PO removed");
                setUrl("");
                setIsEditing(true);
            } else {
                toast.error("Failed to remove PO");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-2 p-3 border rounded-md bg-slate-50">
            <div className="text-sm font-semibold flex items-center justify-between">
                <span>Attached Client PO</span>
                {url && !isEditing && (
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => window.open(url, "_blank")}>
                            <FileText className="h-3 w-3 mr-1" /> View
                        </Button>
                        <Button variant="destructive" size="sm" className="h-7 text-xs px-2" onClick={handleRemove} disabled={loading}>
                            <Trash className="h-3 w-3" />
                        </Button>
                    </div>
                )}
            </div>

            {isEditing && (
                <div className="flex items-center gap-2">
                    <Input
                        type="file"
                        accept=".pdf,image/*"
                        onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;

                            setLoading(true);
                            const formData = new FormData();
                            formData.append("file", file);

                            try {
                                const uploadRes = await fetch("/api/upload", {
                                    method: "POST",
                                    body: formData
                                });
                                const uploadData = await uploadRes.json();

                                if (uploadData.success && uploadData.url) {
                                    const result = await updateOpportunityPoUrl(opportunityId, uploadData.url);
                                    if (result.success) {
                                        toast.success("Client PO uploaded successfully");
                                        setUrl(uploadData.url);
                                        setIsEditing(false);
                                    } else {
                                        toast.error("Failed to link PO to Opportunity");
                                    }
                                } else {
                                    toast.error("Upload failed");
                                }
                            } catch (err) {
                                toast.error("Error uploading file");
                            } finally {
                                setLoading(false);
                            }
                        }}
                        className="flex-1 h-8 text-xs"
                        disabled={loading}
                    />
                    {loading && <span className="text-xs text-slate-500 flex items-center"><Loader2 className="h-3 w-3 animate-spin mr-1" /> Uploading...</span>}
                    {url && !loading && (
                        <Button variant="ghost" size="sm" className="h-8" onClick={() => setIsEditing(false)}>Cancel</Button>
                    )}
                </div>
            )}
            {url && !isEditing && (
                <div className="flex items-center text-xs text-green-700 bg-green-50 p-2 rounded border border-green-200">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    PO Document Successfully Attached
                </div>
            )}
        </div>
    );
}
