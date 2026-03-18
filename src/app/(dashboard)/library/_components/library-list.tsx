"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
    FileText, Download, Trash2, Pencil, Search, ExternalLink, UserCircle, Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { deleteLibraryDoc } from "@/app/actions/library";
import { toast } from "sonner";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { EditLibraryDocDialog } from "./edit-library-doc-dialog";

const ITEMS_PER_PAGE = 9;

const CATEGORY_STYLES: Record<string, string> = {
    Process:    "bg-blue-50 text-blue-700 border-blue-200",
    Quality:    "bg-green-50 text-green-700 border-green-200",
    Compliance: "bg-red-50 text-red-700 border-red-200",
    Training:   "bg-yellow-50 text-yellow-700 border-yellow-200",
    Template:   "bg-purple-50 text-purple-700 border-purple-200",
    General:    "bg-slate-100 text-slate-600 border-slate-200",
    Other:      "bg-slate-100 text-slate-600 border-slate-200",
};

const FILE_TYPE_STYLES: Record<string, string> = {
    pdf:  "bg-red-50 text-red-600",
    docx: "bg-blue-50 text-blue-600",
    doc:  "bg-blue-50 text-blue-600",
};

type LibraryDoc = {
    id: string;
    title: string;
    description: string;
    fileUrl: string;
    fileType: string;
    category?: string | null;
    createdAt: string | Date;
    createdBy?: { name?: string | null } | null;
};

export function LibraryList({ initialDocs }: { initialDocs: LibraryDoc[] }) {
    const router = useRouter();
    const [docs, setDocs] = useState(initialDocs);
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("All");
    const [currentPage, setCurrentPage] = useState(1);

    // Edit dialog state
    const [editOpen, setEditOpen] = useState(false);
    const [editDoc, setEditDoc] = useState<LibraryDoc | null>(null);

    useEffect(() => { setDocs(initialDocs); }, [initialDocs]);
    useEffect(() => { setCurrentPage(1); }, [search, categoryFilter]);

    const uniqueCategories = ["All", ...Array.from(new Set(docs.map((d) => d.category).filter(Boolean) as string[]))];

    const filtered = docs.filter((d) => {
        const matchSearch =
            d.title.toLowerCase().includes(search.toLowerCase()) ||
            d.description.toLowerCase().includes(search.toLowerCase()) ||
            (d.category ?? "").toLowerCase().includes(search.toLowerCase());
        const matchCategory = categoryFilter === "All" || d.category === categoryFilter;
        return matchSearch && matchCategory;
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
    const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    async function handleDelete(id: string) {
        const res = await deleteLibraryDoc(id);
        if (res.success) {
            setDocs((prev) => prev.filter((d) => d.id !== id));
            toast.success("Document deleted.");
        } else {
            toast.error("Failed to delete document.");
        }
    }

    function handleEditSuccess() {
        router.refresh();
    }

    return (
        <div className="space-y-6">
            {/* Search + Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by title, description or category…"
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-full sm:w-48">
                        <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                        {uniqueCategories.map((c) => (
                            <SelectItem key={c} value={c}>
                                {c === "All" ? "All Categories" : c}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Results count */}
            {filtered.length > 0 && (
                <p className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} document{filtered.length !== 1 ? "s" : ""}
                </p>
            )}

            {/* Empty state */}
            {filtered.length === 0 ? (
                <div className="text-center border-2 border-dashed rounded-xl p-16 bg-slate-50/50">
                    <FileText className="mx-auto h-12 w-12 text-slate-300" />
                    <h3 className="mt-4 text-sm font-semibold text-slate-800">No documents found</h3>
                    <p className="mt-1 text-sm text-slate-500">
                        {docs.length === 0
                            ? "Get started by adding your first document."
                            : "Try adjusting your search or filter."}
                    </p>
                </div>
            ) : (
                <>
                    {/* Cards grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {paginated.map((doc) => {
                            const cat = doc.category || "General";
                            const catStyle = CATEGORY_STYLES[cat] ?? CATEGORY_STYLES.Other;
                            const ftStyle = FILE_TYPE_STYLES[doc.fileType] ?? "bg-slate-100 text-slate-600";

                            return (
                                <Card
                                    key={doc.id}
                                    className="group flex flex-col hover:shadow-md hover:border-blue-200 transition-all duration-200"
                                >
                                    <CardContent className="flex flex-col flex-1 p-5 gap-4">
                                        {/* Top: icon + title + badges */}
                                        <div className="flex items-start gap-3">
                                            <div className={`p-2.5 rounded-lg shrink-0 ${ftStyle}`}>
                                                <FileText className="h-6 w-6" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h3
                                                    className="font-semibold text-slate-900 leading-tight line-clamp-2"
                                                    title={doc.title}
                                                >
                                                    {doc.title}
                                                </h3>
                                                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                                    <Badge
                                                        variant="outline"
                                                        className={`text-[11px] px-1.5 py-0 border ${catStyle}`}
                                                    >
                                                        <Tag className="h-2.5 w-2.5 mr-1" />
                                                        {cat}
                                                    </Badge>
                                                    <span className={`text-[11px] font-semibold uppercase px-1.5 py-0.5 rounded ${ftStyle}`}>
                                                        {doc.fileType}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Description */}
                                        <p className="text-sm text-slate-600 leading-relaxed line-clamp-3 flex-1">
                                            {doc.description}
                                        </p>

                                        {/* Footer */}
                                        <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 text-xs text-slate-400 min-w-0">
                                                <UserCircle className="h-3.5 w-3.5 shrink-0" />
                                                <span className="truncate">
                                                    {doc.createdBy?.name ?? "Unknown"} · {format(new Date(doc.createdAt), "dd MMM yyyy")}
                                                </span>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                                <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-blue-600" title="Open">
                                                        <ExternalLink className="h-3.5 w-3.5" />
                                                    </Button>
                                                </a>
                                                <Button
                                                    variant="ghost" size="icon"
                                                    className="h-7 w-7 text-slate-500 hover:text-blue-600"
                                                    title="Edit"
                                                    onClick={() => { setEditDoc(doc); setEditOpen(true); }}
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-red-600" title="Delete">
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Delete document?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                "{doc.title}" will be permanently deleted. This cannot be undone.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => handleDelete(doc.id)}
                                                                className="bg-red-600 hover:bg-red-700 text-white"
                                                            >
                                                                Delete
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between pt-4 border-t">
                            <p className="text-sm text-slate-500">
                                Page {currentPage} of {totalPages}
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline" size="sm"
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                >
                                    Previous
                                </Button>
                                {/* Page number pills */}
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                                        .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                                        .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                                            if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
                                            acc.push(p);
                                            return acc;
                                        }, [])
                                        .map((p, i) =>
                                            p === "..." ? (
                                                <span key={`ellipsis-${i}`} className="px-1 text-slate-400 text-sm">…</span>
                                            ) : (
                                                <Button
                                                    key={p}
                                                    variant={currentPage === p ? "default" : "outline"}
                                                    size="sm"
                                                    className="h-8 w-8 p-0"
                                                    onClick={() => setCurrentPage(p as number)}
                                                >
                                                    {p}
                                                </Button>
                                            )
                                        )}
                                </div>
                                <Button
                                    variant="outline" size="sm"
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Edit dialog */}
            {editDoc && (
                <EditLibraryDocDialog
                    open={editOpen}
                    onOpenChange={setEditOpen}
                    doc={editDoc}
                    onSuccess={handleEditSuccess}
                />
            )}
        </div>
    );
}
