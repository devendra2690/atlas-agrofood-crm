"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExternalLink, Trash, Loader2, UploadCloud, FileText } from "lucide-react";
import { toast } from "sonner";
import { updateShipmentDocument } from "@/app/actions/logistics";
import { Badge } from "@/components/ui/badge";

interface ShipmentDocumentAttachmentProps {
    shipmentId: string;
    documents: string[];
}

export function ShipmentDocumentAttachment({ shipmentId, documents: initialDocs }: ShipmentDocumentAttachmentProps) {
    const [docs, setDocs] = useState<string[]>(initialDocs || []);
    const [isUploading, setIsUploading] = useState(false);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    const handleRemove = async (docUrl: string) => {
        if (!confirm("Are you sure you want to remove this attached document?")) return;
        setIsDeleting(docUrl);
        try {
            const result = await updateShipmentDocument(shipmentId, docUrl, 'remove');
            if (result.success) {
                toast.success("Document removed");
                setDocs(prev => prev.filter(d => d !== docUrl));
            } else {
                toast.error(result.error || "Failed to remove document");
            }
        } catch (error) {
            toast.error("An error occurred while removing");
        } finally {
            setIsDeleting(null);
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const uploadRes = await fetch("/api/upload", {
                method: "POST",
                body: formData
            });
            const uploadData = await uploadRes.json();

            if (uploadData.success && uploadData.url) {
                const result = await updateShipmentDocument(shipmentId, uploadData.url, 'add');
                if (result.success) {
                    toast.success("Document uploaded successfully");
                    setDocs(prev => [...prev, uploadData.url]);
                } else {
                    toast.error(result.error || "Failed to link document to Shipment");
                }
            } else {
                toast.error("Upload failed");
            }
        } catch (err) {
            toast.error("Error uploading file");
        } finally {
            setIsUploading(false);
            // Reset input so the same file can be uploaded again if needed
            e.target.value = '';
        }
    };

    return (
        <div className="flex flex-col gap-2 min-w-[200px]">
            {docs.length > 0 && (
                <div className="flex flex-col gap-1.5">
                    {docs.map((docUrl, idx) => {
                        const filename = docUrl.split('/').pop()?.slice(0, 20) + "..." || `Document ${idx + 1}`;
                        
                        return (
                            <div key={idx} className="flex items-center justify-between gap-2 p-1.5 border rounded bg-slate-50">
                                <Button 
                                    variant="link" 
                                    size="sm" 
                                    className="h-auto p-0 text-xs text-blue-600 justify-start flex-1 truncate" 
                                    onClick={() => window.open(docUrl, "_blank")}
                                    title={docUrl}
                                >
                                    <FileText className="h-3 w-3 mr-1 flex-shrink-0" />
                                    <span className="truncate">{filename}</span>
                                </Button>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-6 w-6 p-0 text-slate-400 hover:text-red-500 hover:bg-red-50" 
                                    onClick={() => handleRemove(docUrl)} 
                                    disabled={isDeleting === docUrl}
                                >
                                    {isDeleting === docUrl ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash className="h-3 w-3" />}
                                </Button>
                            </div>
                        );
                    })}
                </div>
            )}
            
            <div className="relative">
                <Input
                    type="file"
                    accept=".pdf,image/*,.doc,.docx"
                    onChange={handleUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-[0px]"
                    disabled={isUploading}
                    title="Upload Shipment Document"
                />
                <Button variant="outline" size="sm" className="w-full border-dashed h-8 text-xs bg-slate-50 hover:bg-slate-100" disabled={isUploading}>
                    {isUploading ? (
                        <><Loader2 className="h-3 w-3 animate-spin mr-2" /> Uploading...</>
                    ) : (
                        <><UploadCloud className="h-3 w-3 mr-2 text-slate-500" /> Attach Document</>
                    )}
                </Button>
            </div>
        </div>
    );
}
