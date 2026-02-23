"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function ExportButton({ isVendor = false }: { isVendor?: boolean }) {
    const [loading, setLoading] = useState(false);

    const handleExport = async () => {
        setLoading(true);
        try {
            const endpoint = isVendor ? "/api/companies/export?type=vendor" : "/api/companies/export";
            const res = await fetch(endpoint);
            if (!res.ok) {
                toast.error("Failed to generate export file.");
                return;
            }

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = isVendor ? "Vendor_Data.xlsx" : "Client_Prospect_Data.xlsx";
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success("Export successful.");
        } catch (error) {
            console.error(error);
            toast.error("An error occurred during export.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button variant="outline" onClick={handleExport} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Export Data
        </Button>
    );
}
