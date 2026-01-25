"use client";

import { TrustLevel } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { updateCompanyTrustLevel } from "@/app/actions/company";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, ShieldCheck, ShieldAlert, Shield, ShieldQuestion } from "lucide-react";

interface TrustLevelSelectorProps {
    vendorId: string;
    currentLevel: TrustLevel;
}

const levelConfig: Record<TrustLevel, { label: string; color: string; icon: any }> = {
    UNRATED: { label: "Unrated", color: "bg-slate-100 text-slate-600 hover:bg-slate-200", icon: ShieldQuestion },
    LOW: { label: "Low Trust", color: "bg-red-100 text-red-700 hover:bg-red-200", icon: ShieldAlert },
    MEDIUM: { label: "Medium Trust", color: "bg-yellow-100 text-yellow-700 hover:bg-yellow-200", icon: Shield },
    HIGH: { label: "High Trust", color: "bg-green-100 text-green-700 hover:bg-green-200", icon: ShieldCheck },
    VERIFIED: { label: "Verified Partner", color: "bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200", icon: ShieldCheck },
};

export function TrustLevelSelector({ vendorId, currentLevel }: TrustLevelSelectorProps) {
    const [level, setLevel] = useState<TrustLevel>(currentLevel);
    const [isLoading, setIsLoading] = useState(false);

    const handleUpdate = async (newLevel: TrustLevel) => {
        if (newLevel === level) return;

        const previousLevel = level;
        setLevel(newLevel); // Optimistic update
        setIsLoading(true);

        try {
            const result = await updateCompanyTrustLevel(vendorId, newLevel);
            if (!result.success) {
                setLevel(previousLevel); // Revert
                toast.error("Failed to update trust level");
            } else {
                toast.success(`Vendor marked as ${levelConfig[newLevel].label}`);
            }
        } catch (error) {
            setLevel(previousLevel);
            toast.error("An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    const CurrentIcon = levelConfig[level].icon;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <div className="cursor-pointer">
                    <Badge
                        variant="secondary"
                        className={`cursor-pointer transition-colors px-3 py-1 flex items-center gap-1.5 ${levelConfig[level].color}`}
                    >
                        {isLoading ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                            <CurrentIcon className="h-3.5 w-3.5" />
                        )}
                        {levelConfig[level].label}
                    </Badge>
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {Object.keys(levelConfig).map((key) => {
                    const l = key as TrustLevel;
                    const Icon = levelConfig[l].icon;
                    return (
                        <DropdownMenuItem
                            key={l}
                            onClick={() => handleUpdate(l)}
                            className="flex items-center gap-2"
                        >
                            <Icon className={`h-4 w-4 ${l === level ? 'text-primary' : 'text-muted-foreground'}`} />
                            <span>{levelConfig[l].label}</span>
                        </DropdownMenuItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
