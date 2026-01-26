import { getCompany } from "@/app/actions/company";
import { getCommodities } from "@/app/actions/commodity";
import { InteractionTimeline } from "@/components/companies/interaction-timeline";
import { CompanyDialog } from "../_components/company-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Building, Mail, Phone, Calendar, Briefcase, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { CompanyOpportunities } from "../_components/company-opportunities";

export default async function CompanyDetailsPage({ params }: { params: { id: string } }) {
    const { id } = await params;
    const { data: company, success } = await getCompany(id);
    const { data: commodities } = await getCommodities();

    if (!success || !company) {
        notFound();
    }

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col gap-4">
                <Link href="/companies">
                    <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Back to Companies
                    </Button>
                </Link>
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            {company.name}
                            <Badge variant={
                                company.type === 'PROSPECT' ? 'secondary' :
                                    company.type === 'CLIENT' ? 'default' : 'outline'
                            } className="mt-1">
                                {company.type}
                            </Badge>
                        </h1>
                        <p className="text-muted-foreground mt-1 flex items-center gap-2">
                            <Building className="h-4 w-4" />
                            ID: {company.id.substring(0, 8)}...
                        </p>
                    </div>
                    <CompanyDialog
                        company={company}
                        trigger={<Button variant="outline">Edit Company</Button>}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Column: Details & Stats */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Contact Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center">
                                    <Phone className="h-4 w-4 text-slate-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Phone</p>
                                    <p className="text-sm text-muted-foreground">{company.phone || "N/A"}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center">
                                    <Mail className="h-4 w-4 text-slate-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Email</p>
                                    <p className="text-sm text-muted-foreground">{company.email || "N/A"}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center">
                                    <Building className="h-4 w-4 text-slate-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Address</p>
                                    <p className="text-sm text-muted-foreground">
                                        {[company.city?.name, company.state?.name, company.country?.name].filter(Boolean).join(", ") || "N/A"}
                                    </p>
                                </div>
                            </div>

                            {company.commodities && company.commodities.length > 0 && (
                                <div className="border-t pt-4 mt-4">
                                    <p className="text-sm text-muted-foreground mb-2">Commodities</p>
                                    <div className="flex flex-wrap gap-2">
                                        {company.commodities.map(c => (
                                            <Badge key={c.id} variant="secondary">{c.name}</Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className="border-t pt-4 mt-4">
                                <p className="text-sm text-muted-foreground mb-2">Created</p>
                                <div className="flex items-center gap-2 text-sm">
                                    <Calendar className="h-4 w-4 text-slate-400" />
                                    {format(new Date(company.createdAt), "PPP")}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Overview</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-lg text-center">
                                <Briefcase className="h-6 w-6 text-blue-500 mb-2" />
                                <span className="text-2xl font-bold">{company._count.salesOrders}</span>
                                <span className="text-xs text-muted-foreground">Orders</span>
                            </div>
                            <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-lg text-center">
                                <ShoppingCart className="h-6 w-6 text-green-500 mb-2" />
                                <span className="text-2xl font-bold">{company._count.purchaseOrders}</span>
                                <span className="text-xs text-muted-foreground">Purchases</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Main Content (Tabs) */}
                <div className="md:col-span-2">
                    <Tabs defaultValue="timeline" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="timeline">Activity Timeline</TabsTrigger>
                            <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
                            <TabsTrigger value="projects">Projects & Samples</TabsTrigger>
                        </TabsList>

                        <TabsContent value="timeline" className="mt-4">
                            <InteractionTimeline
                                companyId={company.id}
                                interactions={company.interactions}
                            />
                        </TabsContent>

                        <TabsContent value="opportunities" className="mt-4">
                            <CompanyOpportunities
                                opportunities={company.salesOpportunities}
                                company={{ id: company.id, name: company.name }}
                                commodities={commodities || []}
                            />
                        </TabsContent>

                        <TabsContent value="projects" className="mt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Procurement Projects</CardTitle>
                                    <CardDescription>Associated sourcing projects.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {company.projectVendors.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                            No associated projects.
                                        </div>
                                    ) : (
                                        <ul className="space-y-4">
                                            {company.projectVendors.map(pv => (
                                                <li key={pv.id} className="border p-4 rounded-lg">
                                                    <div className="font-medium">{pv.project.name}</div>
                                                    <div className="text-sm text-muted-foreground mt-1">
                                                        Status: {pv.project.status}
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
