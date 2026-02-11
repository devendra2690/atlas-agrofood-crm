
import { Suspense } from "react";
import { getTodos } from "@/app/actions/notes";
import { TaskList } from "./_components/task-list";
import { TaskHeader } from "./_components/task-header";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { auth } from "@/auth";

export default async function TasksPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const session = await auth();
    const params = await searchParams;

    // Default filter: "my" tasks (assigned to me)
    const filter = (typeof params.filter === 'string' ? params.filter : 'my');
    const page = typeof params.page === 'string' ? parseInt(params.page) : 1;
    const search = typeof params.search === 'string' ? params.search : undefined;

    let assignedToId: string | undefined = undefined;

    // Filter Logic
    if (filter === 'my') {
        assignedToId = session?.user?.id;
    } else if (filter === 'all') {
        // Admin only can see all, simpler validation here
        assignedToId = undefined;
    }

    const { data: tasks, success, pagination } = await getTodos({
        page,
        limit: 20,
        search,
        assignedToId,
        type: "TASK" // NEW
    });

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <TaskHeader currentFilter={filter} />
            <Suspense fallback={<div>Loading tasks...</div>}>
                <TaskList tasks={tasks || []} currentUser={session?.user} />
            </Suspense>
            {pagination && (
                <PaginationControls
                    hasNextPage={pagination.page < pagination.totalPages}
                    hasPrevPage={pagination.page > 1}
                    totalPages={pagination.totalPages}
                    currentPage={pagination.page}
                />
            )}
        </div>
    );
}
