"use client";

import { useRouter } from "next/navigation";
import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail } from "lucide-react";
import { CompanyActions } from "./company-actions";

interface CompanyRowProps {
    company: any; // Ideally use proper type
    initialCommodities: { id: string; name: string }[];
    initialCountries: { id: string; name: string }[];
}

export function CompanyRow({ company, initialCommodities, initialCountries }: CompanyRowProps) {
    const router = useRouter();

    const handleRowClick = () => {
        router.push(`/companies/${company.id}`);
    };

    return (
        <TableRow
            className="cursor-pointer hover:bg-slate-50"
            onClick={handleRowClick}
        >
            <TableCell className="font-medium">
                <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-3 font-bold text-xs">
                        {company.name.substring(0, 2).toUpperCase()}
                    </div>
                    {company.name}
                </div>
            </TableCell>
            <TableCell>
                <Badge variant={
                    company.type === 'PROSPECT' ? 'secondary' :
                        company.type === 'CLIENT' ? 'default' : 'outline'
                }>
                    {company.type}
                </Badge>
            </TableCell>
            <TableCell>
                <div className="flex flex-col space-y-1 text-sm text-slate-500">
                    {company.phone && (
                        <div className="flex items-center">
                            <Phone className="h-3 w-3 mr-1" /> {company.phone}
                        </div>
                    )}
                    {company.email && (
                        <div className="flex items-center">
                            <Mail className="h-3 w-3 mr-1" /> {company.email}
                        </div>
                    )}
                </div>
            </TableCell>
            <TableCell>
                <Badge variant="outline" className={company.status === 'ACTIVE' ? "text-green-600 border-green-200 bg-green-50" : "text-slate-500"}>
                    {company.status}
                </Badge>
            </TableCell>
            <TableCell className="text-right text-slate-500">
                <div className="flex justify-end gap-2 text-xs">
                    <span>{company._count?.interactions || 0} Calls</span>
                    <span>•</span>
                    <span>{company._count?.salesOpportunities || 0} Deals</span>
                </div>
            </TableCell>
            <TableCell>
                <CompanyActions
                    company={company}
                    initialCommodities={initialCommodities}
                    initialCountries={initialCountries}
                />
            </TableCell>
        </TableRow>
    );
}
