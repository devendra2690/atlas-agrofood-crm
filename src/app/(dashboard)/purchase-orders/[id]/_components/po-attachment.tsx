"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Link as LinkIcon, Download } from "lucide-react";
import { toast } from "sonner";
import { updatePurchaseOrderPdf } from "@/app/actions/procurement";

interface POAttachmentProps {
    poId: string;
    initialUrl?: string | null;
}

export function POAttachment({ poId, initialUrl }: POAttachmentProps) {
    const [url, setUrl] = useState(initialUrl || "");
    const [isEditing, setIsEditing] = useState(!initialUrl);
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!url) return;
        setLoading(true);
        try {
            const result = await updatePurchaseOrderPdf(poId, url);
            if (result.success) {
                toast.success("PO PDF attached successfully");
                setIsEditing(false);
            } else {
                toast.error("Failed to attach PDF");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center gap-4">
            {!isEditing ? (
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="gap-2" onClick={() => window.open(url, "_blank")}>
                        <FileText className="h-4 w-4 text-green-600" />
                        View Signed PO
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                        Edit Link
                    </Button>
                </div>
            ) : (
                <div className="flex items-center gap-2">
                    <div className="relative">
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
                                        const result = await updatePurchaseOrderPdf(poId, uploadData.url);
                                        if (result.success) {
                                            toast.success("Signed PO uploaded successfully");
                                            setUrl(uploadData.url);
                                            setIsEditing(false);
                                        } else {
                                            toast.error("Failed to link PDF to PO");
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
                            className="w-[300px]"
                            disabled={loading}
                        />
                    </div>
                    {/* Removed manual Save button as we upload on change, or could add a submit button if preferred. 
                        Let's keep it simple: Uploads immediately on selection.
                        But wait, user might pick wrong file. 
                        Let's show "Uploading..." state clearly.
                    */}
                    {loading && <span className="text-sm text-slate-500">Uploading...</span>}
                    {initialUrl && !loading && (
                        <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                    )}
                </div>
            )}
        </div>
    );
}
