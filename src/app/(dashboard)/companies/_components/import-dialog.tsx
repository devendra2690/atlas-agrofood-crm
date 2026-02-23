"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { FileUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { importCompanies } from "@/app/actions/import";

import { ImportResult } from "@/app/actions/import";

export function ImportDialog() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [importErrors, setImportErrors] = useState<{ row: number; reason: string }[]>([]);

    // Ref to directly clear the file input element's internal value
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
            setImportErrors([]);
        }
    };

    const handleImport = async () => {
        if (!file) {
            toast.error("Please select a file first.");
            return;
        }

        setLoading(true);
        setImportErrors([]);

        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data, { type: "array" });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            // Parse to JSON (Header is row 1)
            let rows = XLSX.utils.sheet_to_json(worksheet);

            if (!rows || rows.length === 0) {
                toast.error("No valid data found in the Excel file.");
                setLoading(false);
                return;
            }

            // Sanitize rows to strip any prototype methods added by sheet_to_json
            // Next.js Server Actions ONLY accept plain objects
            rows = JSON.parse(JSON.stringify(rows));

            // Call server action
            const result = await importCompanies(rows);

            if (result.success) {
                toast.success(`Successfully imported ${result.importedCount} companies.`);
                if (result.errors.length > 0) {
                    toast.warning(`${result.errors.length} rows failed to import.`);
                    setImportErrors(result.errors);
                } else {
                    setOpen(false);
                    setFile(null);
                    setImportErrors([]);
                }
            } else {
                toast.error("Import failed or completed with errors.");
                if (result.errors.length > 0) {
                    setImportErrors(result.errors);
                }
            }
        } catch (error) {
            console.error("File processing error:", error);
            toast.error("Failed to parse the Excel file. Please ensure it was not modified structure-wise.");
        } finally {
            setLoading(false);
        }
    };

    // Reset state when dialog is toggled
    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen);
        if (!newOpen) {
            setFile(null);
            setImportErrors([]);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <FileUp className="mr-2 h-4 w-4" />
                    Import Excel
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Import Clients & Prospects</DialogTitle>
                    <DialogDescription>
                        Upload a populated template `.xlsx` file to bulk insert records. Need the template? Use the Export button first.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4 py-4">
                    <div className="flex flex-col gap-2">
                        <input
                            key={open ? "open" : "closed"}
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx, .xls"
                            onChange={handleFileChange}
                            className="block w-full text-sm text-slate-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-md file:border-0
                                file:text-sm file:font-semibold
                                file:bg-blue-50 file:text-blue-700
                                hover:file:bg-blue-100"
                            disabled={loading}
                        />
                    </div>
                    {file && (
                        <p className="text-sm text-muted-foreground">
                            Selected file: <strong>{file.name}</strong>
                        </p>
                    )}

                    {importErrors.length > 0 && (
                        <div className="rounded-md bg-red-50 p-4 border border-red-200 overflow-y-auto max-h-48 mt-2">
                            <h3 className="text-sm font-medium text-red-800 mb-2">
                                Import issues found:
                            </h3>
                            <ul className="list-disc space-y-1 pl-5 text-sm text-red-700">
                                {importErrors.map((err, idx) => (
                                    <li key={idx}>
                                        <strong>Row {err.row}:</strong> {err.reason}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleImport} disabled={!file || loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {loading ? "Importing..." : "Start Import"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
