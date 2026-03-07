"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Plus, FileText, Loader2, CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { createDocument } from "@/app/actions/document-actions";

export function AddDocumentDialog({ companies }: { companies: any[] }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [date, setDate] = useState<Date>();
    const router = useRouter();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!file) {
            toast.error("Please upload a file");
            return;
        }

        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const title = formData.get("title") as string;
        const type = formData.get("type") as string;
        const details = formData.get("details") as string;
        const companyId = formData.get("companyId") as string;

        try {
            // 1. Upload file
            const uploadData = new FormData();
            uploadData.append("file", file);

            const uploadRes = await fetch("/api/upload", {
                method: "POST",
                body: uploadData,
            });

            const uploadJson = await uploadRes.json();

            if (!uploadRes.ok || !uploadJson.success) {
                throw new Error(uploadJson.error || "Failed to upload file");
            }

            // 2. Create document record
            const res = await createDocument({
                title,
                type,
                fileUrl: uploadJson.url,
                details: details || undefined,
                companyId: companyId && companyId !== "none" ? companyId : undefined,
                expiryDate: date || null,
            });

            if (res.success) {
                toast.success("Document uploaded successfully");
                setOpen(false);
                setFile(null);
                setDate(undefined);
                router.refresh();
            } else {
                toast.error(res.error || "Failed to save document record");
            }
        } catch (error: any) {
            toast.error(error.message || "An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Document
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Upload New Document</DialogTitle>
                </DialogHeader>

                <form onSubmit={onSubmit} className="space-y-4 py-4">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="file">File *</Label>
                            <div className="flex items-center gap-4">
                                <Input
                                    id="file"
                                    name="file"
                                    type="file"
                                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                    onChange={handleFileChange}
                                    required
                                    className="file:text-slate-500 file:font-medium file:bg-slate-50 file:border-0 hover:file:bg-slate-100 cursor-pointer"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="title">Document Title *</Label>
                            <Input id="title" name="title" placeholder="e.g., FSSAI License 2026" required />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="type">Document Type *</Label>
                                <Select name="type" required defaultValue="License">
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="License">License</SelectItem>
                                        <SelectItem value="Certificate">Certificate</SelectItem>
                                        <SelectItem value="Contract">Contract</SelectItem>
                                        <SelectItem value="Invoice">Invoice</SelectItem>
                                        <SelectItem value="PO">Purchase Order</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2 flex flex-col pt-1">
                                <Label className="mb-[2px]">Expiry Date (Optional)</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !date && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {date ? format(date, "PPP") : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 flex justify-center mt-1">
                                        <Calendar
                                            mode="single"
                                            selected={date}
                                            onSelect={setDate}
                                            initialFocus
                                            captionLayout="dropdown"
                                            fromYear={2000}
                                            toYear={new Date().getFullYear() + 10}
                                            className="bg-white border rounded-md shadow-lg"
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="companyId">Related Company (Optional)</Label>
                            <Select name="companyId" defaultValue="none">
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a company" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">-- None --</SelectItem>
                                    {companies?.map((company) => (
                                        <SelectItem key={company.id} value={company.id}>
                                            {company.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="details">Additional Details</Label>
                            <Textarea
                                id="details"
                                name="details"
                                placeholder="Any special notes or remarks about this document..."
                                rows={3}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                "Upload Document"
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
