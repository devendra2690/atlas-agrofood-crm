"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription
} from "@/components/ui/dialog";
import { getTaskReportData } from "@/app/actions/notes";
import { Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import { DownloadPdfButton } from "@/components/common/download-pdf-button";
import { TaskListPDF } from "@/components/pdf/task-list-pdf";

export function TaskReportDialog({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [tasks, setTasks] = useState<any[] | null>(null);

    const handleGenerate = async () => {
        setIsLoading(true);
        setTasks(null);

        const res = await getTaskReportData();
        if (res.success && res.data) {
            setTasks(res.data);
        } else {
            toast.error(res.error || "Failed to fetch task data");
        }

        setIsLoading(false);
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) {
                setTasks(null);
            }
        }}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Generate Task List</DialogTitle>
                    <DialogDescription>
                        Generate a PDF report of all pending tasks categorized by their due dates.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6 flex flex-col items-center justify-center space-y-4">
                    {!tasks && !isLoading && (
                        <Button onClick={handleGenerate} className="w-full">
                            <FileText className="mr-2 h-4 w-4" />
                            Generate Report Data
                        </Button>
                    )}

                    {isLoading && (
                        <div className="flex flex-col items-center space-y-2 text-muted-foreground">
                            <Loader2 className="h-8 w-8 animate-spin" />
                            <p>Fetching tasks...</p>
                        </div>
                    )}

                    {tasks && (
                        <div className="flex flex-col items-center space-y-4 w-full">
                            <div className="bg-green-50 text-green-700 p-4 rounded-md text-sm text-center w-full border border-green-200">
                                Report generated successfully! Found {tasks.length} pending tasks.
                            </div>
                            <DownloadPdfButton
                                document={<TaskListPDF tasks={tasks} />}
                                filename={`Task-List-Report-${new Date().toISOString().split('T')[0]}.pdf`}
                                label="Download PDF Report"
                            />
                            <Button variant="outline" onClick={() => setOpen(false)} className="w-full">
                                Close
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
