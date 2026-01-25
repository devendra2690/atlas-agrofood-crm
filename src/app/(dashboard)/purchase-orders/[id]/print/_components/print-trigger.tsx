"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export function PrintTrigger() {
    useEffect(() => {
        // Auto-print when page loads? Or just provide a button.
        // Let's provide a floating button that is hidden when printing
        // window.print();
    }, []);

    return (
        <div className="fixed bottom-8 right-8 print:hidden">
            <Button onClick={() => window.print()} className="shadow-lg gap-2">
                <Printer className="h-4 w-4" />
                Print Purchase Order
            </Button>
        </div>
    );
}
