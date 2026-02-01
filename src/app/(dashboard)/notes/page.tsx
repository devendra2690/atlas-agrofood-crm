import { getTodos } from "@/app/actions/notes";
import { CreateNoteDialog } from "./_components/create-note-dialog";
import { NoteCard } from "./_components/note-card";
import { NoteFilters } from "./_components/note-filters";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { prisma } from "@/lib/prisma"; // Direct prisma if needed, but we use action

export default async function NotesPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const params = await searchParams;
    const page = typeof params.page === 'string' ? parseInt(params.page) : 1;
    const status = typeof params.status === 'string' ? params.status : undefined;
    const priority = typeof params.priority === 'string' ? params.priority : undefined;
    const search = typeof params.search === 'string' ? params.search : undefined;
    const limit = 12; // Grid view, maybe 12 is good

    const highlight = typeof params.highlight === 'string' ? params.highlight : undefined;

    const { data: todos, success, pagination } = await getTodos({
        page,
        limit,
        status,
        priority,
        search,
        type: "NOTE" // NEW
    });

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Discussions</h2>
                    <p className="text-muted-foreground">Team collaboration and notes.</p>
                </div>
                <CreateNoteDialog />
            </div>

            <NoteFilters />

            {!success ? (
                <div>Failed to load notes. Please try again.</div>
            ) : (
                <>
                    {todos?.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                            No notes found. Create one to get started!
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {todos?.map((todo: any) => (
                                <NoteCard
                                    key={todo.id}
                                    note={todo}
                                    isHighlighted={highlight === todo.id}
                                />
                            ))}
                        </div>
                    )}

                    {pagination && (
                        <div className="mt-8">
                            <PaginationControls
                                hasNextPage={pagination.page < pagination.totalPages}
                                hasPrevPage={pagination.page > 1}
                                totalPages={pagination.totalPages}
                                currentPage={pagination.page}
                            />
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
