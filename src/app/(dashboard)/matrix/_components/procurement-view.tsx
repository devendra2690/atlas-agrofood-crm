"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { VendorMatrixGrid } from "./vendor-matrix-grid";
import { SourcingRequestBoard } from "./sourcing-request-board";

export function ProcurementView() {
    return (
        <Tabs defaultValue="requests" className="space-y-4">
            <TabsList>
                <TabsTrigger value="requests">Sourcing Requests</TabsTrigger>
                <TabsTrigger value="matrix">Vendor Matrix</TabsTrigger>
            </TabsList>

            <TabsContent value="requests" className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Incoming Requests</CardTitle>
                        <CardDescription>
                            New commodity requirements from the Sales team.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <SourcingRequestBoard />
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="matrix" className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Vendor Capabilities</CardTitle>
                        <CardDescription>
                            Map vendors to specific varieties and managing their metadata.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <VendorMatrixGrid />
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
}
