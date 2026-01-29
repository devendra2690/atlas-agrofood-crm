import { getProcurementProject } from "@/app/actions/procurement";
import { LinkOpportunityDialog } from "../_components/link-opportunity-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Package, User } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { CompanyOpportunities } from "../../companies/_components/company-opportunities";

import { AddVendorDialog } from "../_components/add-vendor-dialog";
import { VendorList } from "../_components/vendor-list";
import { SampleList } from "../_components/sample-list";
import { ProjectPOList } from "./_components/project-po-list";
import { SampleBoard } from "./_components/sample-board";
import { ProjectStatusSelector } from "./_components/project-status-selector";

export default async function ProcurementProjectPage({ params }: { params: { id: string } }) {
    const { id } = await params;
    // We need to ensure we fetch samples too, if not fetched already. 
    // Ideally we should update getProcurementProject to include samples.
    // Assuming getProcurementProject is NOT yet updated, I'll update it first in next step or use separate call?
    // Let's use separate call for now or trust the include?
    // Let's rely on getProcurementProject being updated. I'll add an instruction to update it concurrently or before.
    // For this step, I'll assume `project.samples` will be there.
    const { data: project, success } = await getProcurementProject(id);

    if (!success || !project) {
        notFound();
    }

    // Sort samples if they exist, or rely on db sort?
    // Let's just pass them.

    const isFulfillment = project.name.startsWith("Fulfillment");
    const isSampleProject = project.type === 'SAMPLE';

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4">
                <Link href="/procurement">
                    <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Back to Procurement
                    </Button>
                </Link>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            {project.name}
                            <ProjectStatusSelector
                                projectId={project.id}
                                currentStatus={project.status}
                                projectName={project.name}
                            />
                            {isSampleProject && (
                                <Badge variant="outline" className="mt-1 bg-purple-100 text-purple-800 border-purple-200">
                                    Sample Only
                                </Badge>
                            )}
                        </h1>
                        <p className="text-muted-foreground mt-1 flex items-center gap-2">
                            Created on {format(new Date(project.createdAt), "PPP")}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Col: Stats placeholder or project info */}
                <div className="space-y-6">
                    {!isSampleProject && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Sourcing Requirement</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {(() => {
                                    const totalDemand = project.salesOpportunities
                                        .filter((opp: any) => opp.status === 'OPEN' || opp.status === 'CLOSED_WON')
                                        .reduce((sum: number, opp: any) => sum + (Number(opp.procurementQuantity) || Number(opp.quantity) || 0), 0);

                                    const totalProcured = (project.purchaseOrders || [])
                                        .filter((po: any) => po.status !== 'CANCELLED')
                                        .reduce((sum: number, po: any) => sum + (Number(po.quantity) || 0), 0);

                                    const balance = totalDemand - totalProcured;

                                    if (Math.abs(balance) < 0.01) {
                                        return (
                                            <>
                                                <div className="text-2xl font-bold flex items-center gap-2 text-green-600">
                                                    Fully Sourced
                                                </div>
                                                <p className="text-xs text-muted-foreground">Demand matched by Supply</p>
                                            </>
                                        );
                                    }

                                    if (balance > 0) {
                                        return (
                                            <>
                                                <div className="text-2xl font-bold flex items-center gap-2 text-amber-600">
                                                    {balance.toFixed(2)} MT
                                                </div>
                                                <p className="text-xs text-muted-foreground">Remaining to Procure</p>
                                            </>
                                        );
                                    }

                                    return (
                                        <>
                                            <div className="text-2xl font-bold flex items-center gap-2 text-blue-600">
                                                {Math.abs(balance).toFixed(2)} MT
                                            </div>
                                            <p className="text-xs text-muted-foreground">Surplus (Excess Procured)</p>
                                        </>
                                    );
                                })()}

                                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                                    <div>
                                        <div className="text-lg font-semibold text-green-600">
                                            {(project.purchaseOrders || [])
                                                .filter((po: any) => po.status !== 'CANCELLED')
                                                .reduce((sum: number, po: any) => sum + (Number(po.quantity) || 0), 0)
                                                .toFixed(2)} MT
                                        </div>
                                        <p className="text-xs text-muted-foreground">Procured (Ordered)</p>
                                    </div>
                                    <div>
                                        <div className="text-lg font-semibold text-blue-600">
                                            {project.salesOpportunities
                                                .filter((opp: any) => opp.status === 'OPEN' || opp.status === 'CLOSED_WON')
                                                .reduce((sum: number, opp: any) => sum + (Number(opp.procurementQuantity) || Number(opp.quantity) || 0), 0).toFixed(2)} MT
                                        </div>
                                        <p className="text-xs text-muted-foreground">Total Demand</p>
                                    </div>
                                </div>
                                <div className="pt-4 border-t space-y-3">
                                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        Linked Demand Source
                                    </div>
                                    {project.salesOpportunities.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">No linked opportunities.</p>
                                    ) : (
                                        <ul className="space-y-3">
                                            {project.salesOpportunities.map((opp: any) => (
                                                <li key={opp.id} className="text-sm bg-slate-50 p-2 rounded border border-slate-100">
                                                    <div className="font-medium text-slate-800 flex items-center gap-2">
                                                        <User className="h-3 w-3 text-muted-foreground" />
                                                        {opp.company?.name || "Unknown Client"}
                                                    </div>
                                                    <div className="text-muted-foreground text-xs mt-1 ml-5">
                                                        {opp.productName} • <span className="font-medium text-slate-700">{opp.procurementQuantity || opp.quantity} MT</span>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                    {isSampleProject && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Sample Project</CardTitle>
                                <CardDescription>Internal testing and validation.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    This project is for managing samples only. There is no sales demand or purchase orders associated.
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right Col: Tabs */}
                <div className="md:col-span-2">
                    <Tabs defaultValue={isSampleProject ? "samples" : (isFulfillment ? "purchase-orders" : "opportunities")} className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                            {!isSampleProject && <TabsTrigger value="opportunities">Demand</TabsTrigger>}
                            {!isSampleProject && <TabsTrigger value="purchase-orders">Purchase Orders</TabsTrigger>}
                            <TabsTrigger value="vendors">Vendors</TabsTrigger>
                            {isSampleProject && <TabsTrigger value="samples">Samples</TabsTrigger>}
                        </TabsList>

                        {!isSampleProject && (
                            <TabsContent value="opportunities" className="mt-4">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between">
                                        <div>
                                            <CardTitle>Linked Opportunities</CardTitle>
                                            <CardDescription>Sales demand driving this project.</CardDescription>
                                        </div>
                                        <LinkOpportunityDialog
                                            projectId={project.id}
                                            projectType={project.type}
                                            currentLinksCount={project.salesOpportunities.length}
                                        />
                                    </CardHeader>
                                    <CardContent>
                                        {project.salesOpportunities.length === 0 ? (
                                            <div className="text-center py-8 text-muted-foreground">
                                                No opportunities linked yet.
                                            </div>
                                        ) : (
                                            <ul className="space-y-4">
                                                {project.salesOpportunities.map(opp => (
                                                    <li key={opp.id} className="border p-4 rounded-lg flex justify-between items-center bg-white">
                                                        <div>
                                                            <div className="font-medium text-base">{opp.productName}</div>
                                                            <div className="text-sm text-muted-foreground">
                                                                Client: {opp.company.name}
                                                            </div>
                                                            <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                                                                {opp.deadline && (
                                                                    <span className="flex items-center text-xs bg-slate-100 px-2 py-1 rounded">
                                                                        Delivery: {format(new Date(opp.deadline), "MMM d, yyyy")}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="flex flex-col items-end gap-1">
                                                                <div className="font-bold flex items-center gap-2">
                                                                    {opp.quantity ? `${opp.quantity} MT` : '-'}
                                                                    {opp.procurementQuantity && (
                                                                        <Badge variant="secondary" className="text-amber-700 bg-amber-50 border-amber-200 ml-2">
                                                                            Raw: {opp.procurementQuantity} MT
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                <Badge variant="outline" className="w-fit">{opp.status}</Badge>
                                                            </div>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        )}

                        {!isSampleProject && (
                            <TabsContent value="purchase-orders" className="mt-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Purchase Orders</CardTitle>
                                        <CardDescription>Orders placed for this project.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <ProjectPOList purchaseOrders={(project.purchaseOrders || [])} />
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        )}

                        <TabsContent value="vendors" className="mt-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle>Shortlisted Vendors</CardTitle>
                                        <CardDescription>Suppliers for this project.</CardDescription>
                                    </div>
                                    <AddVendorDialog projectId={project.id} />
                                </CardHeader>
                                <CardContent>
                                    <VendorList projectVendors={project.projectVendors} samples={project.samples || []} isFulfillment={isFulfillment} />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {isSampleProject && (
                            <TabsContent value="samples" className="mt-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Samples Tracking</CardTitle>
                                        <CardDescription>Manage sample requests and approvals.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="h-full">
                                        {/* Switched to Board View by default */}
                                        {(() => {
                                            // Merge project samples with confirmed/approved samples from linked opportunities
                                            const opportunitySamples = project.salesOpportunities.flatMap((opp: any) =>
                                                (opp.sampleSubmissions || []).map((sub: any) => sub.sample)
                                            ).filter(Boolean);

                                            const allSamples = [...(project.samples || []), ...opportunitySamples];

                                            // Deduplicate by ID
                                            const uniqueSamples = Array.from(new Map(allSamples.map((s: any) => [s.id, s])).values());

                                            return (
                                                <SampleBoard
                                                    initialSamples={uniqueSamples}
                                                    projectId={project.id}
                                                    projectVendors={project.projectVendors || []}
                                                />
                                            );
                                        })()}
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        )}
                    </Tabs>
                </div>
            </div>
        </div>
    );
}

