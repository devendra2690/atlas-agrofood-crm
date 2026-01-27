"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface ExportButtonProps {
    data: any[];
    filename?: string;
}

export function ExportButton({ data, filename = "profitability-report.csv" }: ExportButtonProps) {
    const handleExport = () => {
        if (!data || data.length === 0) return;

        // Convert JSON to CSV
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','), // Header row
            ...data.map(row => headers.map(fieldName => {
                const val = row[fieldName];
                return typeof val === 'string' ? `"${val}"` : val;
            }).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);

        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
        </Button>
    );
}
