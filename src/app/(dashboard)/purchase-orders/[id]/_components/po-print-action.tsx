"use client";

import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import Link from "next/link";

interface POPrintActionProps {
    poId: string;
}

export function POPrintAction({ poId }: POPrintActionProps) {
    return (
        <Link href={`/purchase-orders/${poId}/print`} target="_blank">
            <Button variant="outline" className="gap-2">
                <Printer className="h-4 w-4" />
                Print PO
            </Button>
        </Link>
    );
}
