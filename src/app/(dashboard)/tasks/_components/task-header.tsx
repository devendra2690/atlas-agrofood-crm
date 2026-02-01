
"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { TaskDialog } from "./task-dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter, useSearchParams } from "next/navigation";

export function TaskHeader({ currentFilter }: { currentFilter: string }) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const handleFilterChange = (value: string) => {
        const params = new URLSearchParams(searchParams);
        params.set('filter', value);
        params.set('page', '1');
        router.push(`/tasks?${params.toString()}`);
    };

    return (
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Tasks</h2>
                <p className="text-muted-foreground">Manage and track team assignments.</p>
            </div>

            <div className="flex items-center gap-2">
                <Tabs value={currentFilter} onValueChange={handleFilterChange} className="w-[400px]">
                    <TabsList>
                        <TabsTrigger value="my">My Tasks</TabsTrigger>
                        <TabsTrigger value="assigned">Assigned by Me</TabsTrigger>
                        <TabsTrigger value="all">All Tasks</TabsTrigger>
                    </TabsList>
                </Tabs>

                <TaskDialog>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        New Task
                    </Button>
                </TaskDialog>
            </div>
        </div>
    );
}
