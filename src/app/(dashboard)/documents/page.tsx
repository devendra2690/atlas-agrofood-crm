import { getDocuments } from "@/app/actions/document-actions";
import { DocumentList } from "./_components/document-list";
import { AddDocumentDialog } from "./_components/add-document-dialog";
import { getCompanies } from "@/app/actions/company";

export default async function DocumentsPage() {
    const [{ documents }, { data: companies }] = await Promise.all([
        getDocuments(),
        getCompanies(), // Try fetching all companies to pass to the dialog
    ]);

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
                    <p className="text-muted-foreground">Manage your licenses, contracts, and other files.</p>
                </div>
                <AddDocumentDialog companies={companies || []} />
            </div>

            <DocumentList initialDocuments={documents || []} />
        </div>
    );
}
