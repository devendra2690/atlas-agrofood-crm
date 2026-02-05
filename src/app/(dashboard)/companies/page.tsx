import { Suspense } from "react";
import { getCompanies } from "@/app/actions/company";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { SearchInput } from "@/components/search-input";
import { CompanyDialog } from "./_components/company-dialog";
import { CompanyRow } from "./_components/company-row";
import { PaginationControls } from "@/components/ui/pagination-controls";

import { getCommodities } from "@/app/actions/commodity";
import { getCountries } from "@/app/actions/location";

export default async function CompaniesPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const params = await searchParams;
    const page = typeof params.page === 'string' ? parseInt(params.page) : 1;
    const limit = 10;

    const query = typeof params.query === 'string' ? params.query : undefined;

    const [companiesRes, commoditiesRes, countriesRes] = await Promise.all([
        getCompanies({ page, limit, query }),
        getCommodities(),
        getCountries()
    ]);

    const companies = companiesRes.data;
    const pagination = companiesRes.pagination;
    const initialCommodities = commoditiesRes.data || [];
    const initialCountries = countriesRes.data || [];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Companies</h2>
                    <p className="text-muted-foreground">
                        Manage your Clients, Prospects, and Vendors.
                    </p>
                </div>
                <CompanyDialog
                    initialCommodities={initialCommodities}
                    initialCountries={initialCountries}
                />
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg font-medium">All Companies</CardTitle>
                    <div className="flex w-[300px] items-center space-x-2">
                        <Suspense fallback={<div className="h-9 w-full bg-muted animate-pulse rounded-md" />}>
                            <SearchInput placeholder="Search companies..." />
                        </Suspense>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Activities</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {companies?.map((company) => (
                                <CompanyRow
                                    key={company.id}
                                    company={company}
                                    initialCommodities={initialCommodities}
                                    initialCountries={initialCountries}
                                />
                            ))}
                            {(!companies || companies.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                        No companies found. Add one to get started.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                    {pagination && (
                        <PaginationControls
                            hasNextPage={pagination.page < pagination.totalPages}
                            hasPrevPage={pagination.page > 1}
                            totalPages={pagination.totalPages}
                            currentPage={pagination.page}
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
