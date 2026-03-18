import { getLibraryDocs } from "@/app/actions/library";
import { LibraryList } from "./_components/library-list";
import { AddLibraryDocButton } from "./_components/add-library-doc-button";
import { Library } from "lucide-react";

export default async function LibraryPage() {
    const { data: docs } = await getLibraryDocs();

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                        <Library className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Document Library</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Store, search, and manage your process guides, SOPs, and reference documents.
                        </p>
                    </div>
                </div>
                <AddLibraryDocButton />
            </div>

            <LibraryList initialDocs={(docs as any[]) ?? []} />
        </div>
    );
}
