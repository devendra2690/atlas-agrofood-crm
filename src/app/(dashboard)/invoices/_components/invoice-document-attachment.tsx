"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Download, Trash, CheckCircle2, Loader2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { updateInvoiceDocument } from "@/app/actions/finance";

interface InvoiceDocumentAttachmentProps {
    invoiceId: string;
    initialUrl?: string | null;
}

export function InvoiceDocumentAttachment({ invoiceId, initialUrl }: InvoiceDocumentAttachmentProps) {
    const [url, setUrl] = useState(initialUrl || "");
    const [isEditing, setIsEditing] = useState(!initialUrl);
    const [loading, setLoading] = useState(false);

    const handleRemove = async () => {
        if (!confirm("Are you sure you want to remove this attached invoice document?")) return;
        setLoading(true);
        try {
            const result = await updateInvoiceDocument(invoiceId, "");
            if (result.success) {
                toast.success("Document removed");
                setUrl("");
                setIsEditing(true);
            } else {
                toast.error("Failed to remove document");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-2 mt-2">
            {!url || isEditing ? (
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
                                    const result = await updateInvoiceDocument(invoiceId, uploadData.url);
                                    if (result.success) {
                                        toast.success("Document uploaded successfully");
                                        setUrl(uploadData.url);
                                        setIsEditing(false);
                                    } else {
                                        toast.error("Failed to link document to Invoice");
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
                        className="flex-1 h-8 text-xs bg-white"
                        disabled={loading}
                    />
                    {loading && <span className="text-xs text-slate-500 flex items-center"><Loader2 className="h-3 w-3 animate-spin mr-1" /></span>}
                    {url && !loading && (
                        <Button variant="ghost" size="sm" className="h-8" onClick={() => setIsEditing(false)}>Cancel</Button>
                    )}
                </div>
            ) : (
                <div className="flex items-center gap-2 mt-1">
                    <Button variant="outline" size="sm" className="h-7 text-xs flex-1 border-green-200 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800" onClick={() => window.open(url, "_blank")}>
                        <CheckCircle2 className="h-3 w-3 mr-1" /> View Signed Doc
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-red-500" onClick={handleRemove} disabled={loading}>
                        <Trash className="h-3 w-3" />
                    </Button>
                </div>
            )}
        </div>
    );
}
