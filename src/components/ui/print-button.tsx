"use client";

import { Button } from "./button";
import { Printer } from "lucide-react";

export function PrintButton() {
    return (
        <Button
            onClick={() => setTimeout(() => window.print(), 50)}
            className="fixed bottom-8 right-8 shadow-lg print:hidden z-50 rounded-full h-14 w-14 p-0"
        >
            <Printer className="h-6 w-6" />
            <span className="sr-only">Print Document</span>
        </Button>
    );
}
