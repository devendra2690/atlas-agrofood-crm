"use client";

import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";

// Dynamically import PDFDownloadLink to avoid SSR issues with @react-pdf/renderer
const PDFDownloadLink = dynamic(
    () => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink),
    {
        ssr: false,
        loading: () => (
            <Button variant="outline" disabled>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading PDF...
            </Button>
        ),
    }
);

interface DownloadPdfButtonProps {
    document: React.ReactElement;
    filename: string;
    label?: string;
}

export function DownloadPdfButton({ document, filename, label = "Download PDF" }: DownloadPdfButtonProps) {
    return (
        <PDFDownloadLink document={document as any} fileName={filename}>
            {/* @ts-ignore - render prop signature mismatch often happens with this lib */}
            {({ blob, url, loading, error }: any) => (
                <Button variant="outline" disabled={loading}>
                    {loading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <FileDown className="mr-2 h-4 w-4" />
                    )}
                    {label}
                </Button>
            )}
        </PDFDownloadLink>
    );
}
