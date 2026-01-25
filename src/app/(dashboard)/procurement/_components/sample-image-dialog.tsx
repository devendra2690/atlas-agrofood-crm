"use client";

import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { X } from "lucide-react";

interface SampleImageDialogProps {
    images: string[];
    trigger: React.ReactNode;
}

export function SampleImageDialog({ images, trigger }: SampleImageDialogProps) {
    if (!images || images.length === 0) return <>{trigger}</>;

    return (
        <Dialog>
            <DialogTrigger asChild>
                <div className="cursor-pointer">{trigger}</div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] bg-transparent border-none shadow-none p-0">
                <DialogTitle className="sr-only">Sample Images</DialogTitle>
                <div className="relative bg-white rounded-lg overflow-hidden p-2">
                    <div className="grid grid-cols-1 gap-4 max-h-[80vh] overflow-y-auto">
                        {images.map((img, idx) => (
                            <img
                                key={idx}
                                src={img}
                                alt={`Sample ${idx + 1}`}
                                className="w-full h-auto object-contain rounded-md"
                            />
                        ))}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
