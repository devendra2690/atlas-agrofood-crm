"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Eye } from "lucide-react";

interface LogViewerProps {
    subject: string | null;
    body: string | null;
}

export function LogViewer({ subject, body }: LogViewerProps) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Eye className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{subject || "No Subject"}</DialogTitle>
                </DialogHeader>
                <div className="mt-4 whitespace-pre-wrap text-sm text-slate-700">
                    {body || "No content available."}
                </div>
            </DialogContent>
        </Dialog>
    );
}
