"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { FileText, Download, Trash2, Calendar, Building2, UserCircle, ExternalLink, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { deleteDocument } from "@/app/actions/document-actions";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Link from "next/link";

export function DocumentList({ initialDocuments }: { initialDocuments: any[] }) {
    const [documents, setDocuments] = useState(initialDocuments);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    // Local states for filtering and pagination
    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState("All");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 9;

    // Fix refresh issue: update local state when new documents are passed down
    useEffect(() => {
        setDocuments(initialDocuments);
    }, [initialDocuments]);

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, typeFilter]);

    const handleDelete = async (id: string) => {
        setIsDeleting(id);
        try {
            const res = await deleteDocument(id);
            if (res.success) {
                setDocuments((prev) => prev.filter((doc) => doc.id !== id));
                toast.success("Document deleted successfully");
            } else {
                toast.error(res.error || "Failed to delete document");
            }
        } catch (error) {
            toast.error("An error occurred while deleting");
        } finally {
            setIsDeleting(null);
        }
    };

    // Derived states
    const uniqueTypes = ["All", ...Array.from(new Set(documents.map(d => d.type)))];

    const filteredDocuments = documents.filter((doc) => {
        const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (doc.company?.name || "").toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = typeFilter === "All" || doc.type === typeFilter;
        return matchesSearch && matchesType;
    });

    const totalPages = Math.max(1, Math.ceil(filteredDocuments.length / itemsPerPage));
    const paginatedDocuments = filteredDocuments.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="space-y-6">
            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name or company..."
                        className="pl-9 bg-white"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="w-full sm:w-[180px]">
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="bg-white">
                            <SelectValue placeholder="All Types" />
                        </SelectTrigger>
                        <SelectContent>
                            {uniqueTypes.map(t => (
                                <SelectItem key={t as string} value={t as string}>
                                    {t === "All" ? "All Types" : t as string}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {filteredDocuments.length === 0 ? (
                <div className="text-center p-12 mt-6 border-2 border-dashed rounded-lg bg-slate-50/50">
                    <FileText className="mx-auto h-12 w-12 text-slate-300" />
                    <h3 className="mt-4 text-sm font-semibold text-slate-900">No documents found</h3>
                    <p className="mt-1 text-sm text-slate-500">
                        {documents.length === 0
                            ? "Get started by uploading a new document."
                            : "No documents match your search criteria."}
                    </p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {paginatedDocuments.map((doc) => {
                            const isExpired = doc.expiryDate && new Date(doc.expiryDate) < new Date();
                            const expiresSoon = doc.expiryDate && new Date(doc.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) && !isExpired;

                            return (
                                <Card key={doc.id} className="group relative hover:border-blue-200 transition-colors">
                                    <CardContent className="p-5">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
                                                    <FileText className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <h3 className="font-medium text-slate-900 line-clamp-1" title={doc.title}>
                                                        {doc.title}
                                                    </h3>
                                                    <Badge variant="secondary" className="mt-1 text-xs">
                                                        {doc.type}
                                                    </Badge>
                                                </div>
                                            </div>

                                            <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-blue-600" asChild>
                                                    <Link href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                                                        <ExternalLink className="h-4 w-4" />
                                                    </Link>
                                                </Button>

                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-red-600">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This will permanently delete "{doc.title}". This action cannot be undone.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => handleDelete(doc.id)}
                                                                className="bg-red-600 hover:bg-red-700"
                                                            >
                                                                Delete
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </div>

                                        {doc.details && (
                                            <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                                                {doc.details}
                                            </p>
                                        )}

                                        <div className="space-y-2 text-sm text-slate-500 pt-4 border-t border-slate-100">
                                            {doc.company && (
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="h-4 w-4 text-slate-400" />
                                                    <span className="truncate">{doc.company.name}</span>
                                                </div>
                                            )}

                                            {doc.expiryDate && (
                                                <div className="flex items-center gap-2">
                                                    <Calendar className={`h-4 w-4 ${isExpired ? 'text-red-500' : expiresSoon ? 'text-amber-500' : 'text-slate-400'}`} />
                                                    <span className={isExpired ? 'text-red-600 font-medium' : expiresSoon ? 'text-amber-600 font-medium' : ''}>
                                                        Expires: {format(new Date(doc.expiryDate), "dd MMM yyyy")}
                                                    </span>
                                                    {isExpired && <Badge variant="destructive" className="ml-auto text-[10px]">Expired</Badge>}
                                                    {expiresSoon && <Badge variant="outline" className="ml-auto text-[10px] text-amber-600 border-amber-200 bg-amber-50 mb-0">Soon</Badge>}
                                                </div>
                                            )}

                                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                                <UserCircle className="h-3.5 w-3.5" />
                                                <span>Added by {doc.createdBy?.name || 'Unknown'} on {format(new Date(doc.createdAt), "dd MMM yyyy")}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between pt-4 pb-8 border-t">
                            <div className="text-sm text-slate-500">
                                Showing {Math.min(filteredDocuments.length, (currentPage - 1) * itemsPerPage + 1)} to {Math.min(filteredDocuments.length, currentPage * itemsPerPage)} of {filteredDocuments.length} documents
                            </div>
                            <div className="flex items-center space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
