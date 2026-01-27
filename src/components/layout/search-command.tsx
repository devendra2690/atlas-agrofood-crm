"use client";

import * as React from "react";
import { Search, Calculator, Calendar, CreditCard, Settings, User, Smile, Command as CommandIcon } from "lucide-react";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"; // Assuming shadcn wrapper exists, if not use cmdk direct
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
// If shadcn command isn't installed, we might need to install it or use raw CMDK.
// I'll assume raw CMDK usage first or try to use what's likely available or check for ui/command?
// Let's check for ui/command first. If not found, I'll stick to raw cmdk or basic dialog.
// Wait, I haven't checked components/ui/command.tsx. 
// I will attempt to use standard shadcn imports. If they fail, I'll fix.

import { searchGlobal, SearchResult } from "@/app/actions/search";

export function SearchCommand() {
    const [open, setOpen] = React.useState(false);
    const [query, setQuery] = React.useState("");
    const [results, setResults] = React.useState<SearchResult[]>([]);
    const router = useRouter();

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };
        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    React.useEffect(() => {
        if (query.length < 2) {
            setResults([]);
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            const data = await searchGlobal(query);
            setResults(data);
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    const runCommand = React.useCallback((command: () => unknown) => {
        setOpen(false);
        command();
    }, []);

    return (
        <>
            <Button
                variant="outline"
                className="relative h-9 w-9 p-0 xl:h-10 xl:w-60 xl:justify-start xl:px-3 xl:py-2 text-muted-foreground bg-muted/50 border-muted-foreground/20 shadow-none hover:bg-muted/80"
                onClick={() => setOpen(true)}
            >
                <Search className="h-4 w-4 xl:mr-2" />
                <span className="hidden xl:inline-flex">Search...</span>
                <kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 xl:flex">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </Button>

            {/* Using shadcn CommandDialog if available, assuming standard setup */}
            <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput
                    placeholder="Type a command or search..."
                    value={query}
                    onValueChange={setQuery}
                />
                <CommandList>
                    <CommandEmpty>No results found.</CommandEmpty>
                    {results.length > 0 && (
                        <CommandGroup heading="Results">
                            {results.map((result) => (
                                <CommandItem
                                    key={result.id}
                                    value={`${result.title} ${result.subtitle}`} // Value for internal filtering if needed, though we search server side
                                    onSelect={() => {
                                        runCommand(() => router.push(result.url));
                                    }}
                                >
                                    <div className="flex flex-col">
                                        <span className="font-medium">{result.title}</span>
                                        <span className="text-xs text-muted-foreground">{result.subtitle}</span>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    )}

                    {/* Default Actions if query is empty */}
                    {query.length === 0 && (
                        <CommandGroup heading="Quick Links">
                            <CommandItem onSelect={() => runCommand(() => router.push('/companies/new'))}>
                                <User className="mr-2 h-4 w-4" />
                                <span>New Company</span>
                            </CommandItem>
                            <CommandItem onSelect={() => runCommand(() => router.push('/opportunities/new'))}>
                                <CreditCard className="mr-2 h-4 w-4" />
                                <span>New Opportunity</span>
                            </CommandItem>
                            <CommandItem onSelect={() => runCommand(() => router.push('/settings'))}>
                                <Settings className="mr-2 h-4 w-4" />
                                <span>Settings</span>
                            </CommandItem>
                        </CommandGroup>
                    )}
                </CommandList>
            </CommandDialog>
        </>
    );
}
