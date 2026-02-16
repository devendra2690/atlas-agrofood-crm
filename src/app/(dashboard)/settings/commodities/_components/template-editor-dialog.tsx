"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Plus, Trash2, Save, GripVertical } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { updateCommodity } from "@/app/actions/commodity";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TemplateField {
    label: string;
    type: 'text' | 'number' | 'date' | 'select' | 'textarea';
    options?: string; // Comma separated for select
    defaultValue?: string;
}

interface TemplateSection {
    title: string;
    fields: TemplateField[];
}

interface TemplateEditorDialogProps {
    commodityId: string;
    initialTemplate?: { sections: TemplateSection[] };
    trigger?: React.ReactNode;
    commodities?: { id: string, name: string, documentTemplate?: any }[];
}

export function TemplateEditorDialog({ commodityId, initialTemplate, trigger, commodities = [] }: TemplateEditorDialogProps) {
    const [open, setOpen] = useState(false);
    const [sections, setSections] = useState<TemplateSection[]>(initialTemplate?.sections || []);
    const [loading, setLoading] = useState(false);

    const handleAddSection = () => {
        setSections([...sections, { title: "New Section", fields: [] }]);
    };

    const handleRemoveSection = (index: number) => {
        const newSections = [...sections];
        newSections.splice(index, 1);
        setSections(newSections);
    };

    const handleSectionTitleChange = (index: number, title: string) => {
        const newSections = [...sections];
        newSections[index].title = title;
        setSections(newSections);
    };

    const handleAddField = (sectionIndex: number) => {
        const newSections = [...sections];
        newSections[sectionIndex].fields.push({ label: "New Field", type: "text" });
        setSections(newSections);
    };

    const handleRemoveField = (sectionIndex: number, fieldIndex: number) => {
        const newSections = [...sections];
        newSections[sectionIndex].fields.splice(fieldIndex, 1);
        setSections(newSections);
    };

    const handleFieldChange = (sectionIndex: number, fieldIndex: number, key: keyof TemplateField, value: string) => {
        const newSections = [...sections];
        // @ts-ignore
        newSections[sectionIndex].fields[fieldIndex][key] = value;
        setSections(newSections);
    };

    const handleSave = async () => {
        setLoading(true);
        const template = { sections };

        // Pass undefined for name/yield/wastage to trigger partial update
        const result = await updateCommodity(commodityId, undefined, undefined, undefined, template);

        if (result.success) {
            toast.success("Document template saved successfully");
            setOpen(false);
        } else {
            toast.error(result.error || "Failed to save template");
        }
        setLoading(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm">
                        <FileText className="h-4 w-4 mr-2" />
                        Template
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-4xl h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Document Template Editor</DialogTitle>
                    <div className="flex items-center justify-between">
                        <DialogDescription>
                            Define sections and fields for generating documents for this commodity.
                        </DialogDescription>
                        {commodities.length > 0 && (
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground whitespace-nowrap">Copy from:</span>
                                <Select onValueChange={(val) => {
                                    const selected = commodities.find(c => c.id === val);
                                    if (selected?.documentTemplate?.sections) {
                                        if (confirm("This will overwrite current sections. Continue?")) {
                                            setSections(selected.documentTemplate.sections);
                                            toast.success(`Imported template from ${selected.name}`);
                                        }
                                    } else {
                                        toast.error("Selected commodity has no template");
                                    }
                                }}>
                                    <SelectTrigger className="h-8 w-[180px] text-xs">
                                        <SelectValue placeholder="Select Commodity" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {commodities
                                            .filter(c => c.id !== commodityId)
                                            .map(c => (
                                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                            ))
                                        }
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto min-h-0 px-1">
                    <div className="space-y-6 py-4">
                        {sections.map((section, sIndex) => (
                            <div key={sIndex} className="border rounded-xl p-5 bg-white shadow-sm relative group space-y-4">
                                {/* Section Header */}
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 space-y-1.5">
                                        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Section Title</Label>
                                        <Input
                                            value={section.title}
                                            onChange={(e) => handleSectionTitleChange(sIndex, e.target.value)}
                                            className="font-semibold text-base"
                                            placeholder="e.g. Technical Specifications"
                                        />
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveSection(sIndex)} className="text-slate-400 hover:text-red-600 hover:bg-red-50 -mr-2">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>

                                {/* Fields List */}
                                <div className="space-y-3">
                                    {section.fields.map((field, fIndex) => (
                                        <div key={fIndex} className="flex gap-3 items-end p-3 rounded-lg bg-slate-50/50 hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors">
                                            <div className="flex-[2]">
                                                <Label className="text-[10px] text-muted-foreground mb-1.5 block">Label</Label>
                                                <Input
                                                    value={field.label}
                                                    onChange={(e) => handleFieldChange(sIndex, fIndex, 'label', e.target.value)}
                                                    className="h-9 text-sm bg-white"
                                                    placeholder="Field Name"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-[100px]">
                                                <Label className="text-[10px] text-muted-foreground mb-1.5 block">Type</Label>
                                                <Select
                                                    value={field.type}
                                                    onValueChange={(val) => handleFieldChange(sIndex, fIndex, 'type', val)}
                                                >
                                                    <SelectTrigger className="h-9 text-sm bg-white">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="text">Text</SelectItem>
                                                        <SelectItem value="number">Number</SelectItem>
                                                        <SelectItem value="date">Date</SelectItem>
                                                        <SelectItem value="textarea">Text Area</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="flex-[1.5]">
                                                <Label className="text-[10px] text-muted-foreground mb-1.5 block">Default</Label>
                                                <Input
                                                    value={field.defaultValue || ''}
                                                    onChange={(e) => handleFieldChange(sIndex, fIndex, 'defaultValue', e.target.value)}
                                                    className="h-9 text-sm bg-white"
                                                    placeholder="Value"
                                                />
                                            </div>
                                            <Button variant="ghost" size="icon" onClick={() => handleRemoveField(sIndex, fIndex)} className="h-9 w-9 text-slate-400 hover:text-red-500 shrink-0">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>

                                {/* Add Field Button */}
                                <div>
                                    <Button variant="ghost" size="sm" onClick={() => handleAddField(sIndex)} className="text-xs font-medium text-muted-foreground hover:text-primary">
                                        <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Field
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <DialogFooter className="flex justify-between items-center border-t pt-4">
                    <Button variant="outline" onClick={handleAddSection}>
                        <Plus className="h-4 w-4 mr-2" /> Add Section
                    </Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading && <FileText className="mr-2 h-4 w-4 animate-spin" />}
                        Save Template
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
