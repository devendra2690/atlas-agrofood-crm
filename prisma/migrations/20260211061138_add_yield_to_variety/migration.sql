-- CreateEnum
CREATE TYPE "TodoType" AS ENUM ('NOTE', 'TASK');

-- AlterEnum
ALTER TYPE "CompanyType" ADD VALUE 'PARTNER';

-- AlterTable
ALTER TABLE "Commodity" ADD COLUMN     "documentTemplate" JSONB;

-- AlterTable
ALTER TABLE "CommodityVariety" ADD COLUMN     "yieldPercentage" DOUBLE PRECISION NOT NULL DEFAULT 100.0;

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "contactName" TEXT,
ADD COLUMN     "website" TEXT;

-- AlterTable
ALTER TABLE "ProcurementProject" ADD COLUMN     "varietyId" TEXT;

-- AlterTable
ALTER TABLE "SalesOpportunity" ADD COLUMN     "varietyId" TEXT;

-- AlterTable
ALTER TABLE "SampleRecord" ADD COLUMN     "qualityCertifications" JSONB NOT NULL DEFAULT '[]',
ALTER COLUMN "images" SET DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Todo" ADD COLUMN     "assignedToId" TEXT,
ADD COLUMN     "type" "TodoType" NOT NULL DEFAULT 'NOTE';

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "receipts" TEXT[];

-- CreateTable
CREATE TABLE "EmailLog" (
    "id" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "provider" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT,
    "campaignId" TEXT,

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NoteReply" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "todoId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NoteReply_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Bill_purchaseOrderId_idx" ON "Bill"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "Bill_vendorId_idx" ON "Bill"("vendorId");

-- CreateIndex
CREATE INDEX "Bill_createdAt_idx" ON "Bill"("createdAt");

-- CreateIndex
CREATE INDEX "Company_type_idx" ON "Company"("type");

-- CreateIndex
CREATE INDEX "Company_status_idx" ON "Company"("status");

-- CreateIndex
CREATE INDEX "Company_createdAt_idx" ON "Company"("createdAt");

-- CreateIndex
CREATE INDEX "Company_countryId_idx" ON "Company"("countryId");

-- CreateIndex
CREATE INDEX "Company_stateId_idx" ON "Company"("stateId");

-- CreateIndex
CREATE INDEX "Company_cityId_idx" ON "Company"("cityId");

-- CreateIndex
CREATE INDEX "GRN_purchaseOrderId_idx" ON "GRN"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "GRN_createdAt_idx" ON "GRN"("createdAt");

-- CreateIndex
CREATE INDEX "InteractionLog_companyId_idx" ON "InteractionLog"("companyId");

-- CreateIndex
CREATE INDEX "InteractionLog_userId_idx" ON "InteractionLog"("userId");

-- CreateIndex
CREATE INDEX "InteractionLog_date_idx" ON "InteractionLog"("date");

-- CreateIndex
CREATE INDEX "Invoice_salesOrderId_idx" ON "Invoice"("salesOrderId");

-- CreateIndex
CREATE INDEX "Invoice_createdAt_idx" ON "Invoice"("createdAt");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");

-- CreateIndex
CREATE INDEX "ProjectVendor_projectId_idx" ON "ProjectVendor"("projectId");

-- CreateIndex
CREATE INDEX "ProjectVendor_vendorId_idx" ON "ProjectVendor"("vendorId");

-- CreateIndex
CREATE INDEX "PurchaseOrder_projectId_idx" ON "PurchaseOrder"("projectId");

-- CreateIndex
CREATE INDEX "PurchaseOrder_vendorId_idx" ON "PurchaseOrder"("vendorId");

-- CreateIndex
CREATE INDEX "PurchaseOrder_createdAt_idx" ON "PurchaseOrder"("createdAt");

-- CreateIndex
CREATE INDEX "PurchaseOrder_status_idx" ON "PurchaseOrder"("status");

-- CreateIndex
CREATE INDEX "SalesOpportunity_companyId_idx" ON "SalesOpportunity"("companyId");

-- CreateIndex
CREATE INDEX "SalesOpportunity_commodityId_idx" ON "SalesOpportunity"("commodityId");

-- CreateIndex
CREATE INDEX "SalesOpportunity_procurementProjectId_idx" ON "SalesOpportunity"("procurementProjectId");

-- CreateIndex
CREATE INDEX "SalesOpportunity_createdAt_idx" ON "SalesOpportunity"("createdAt");

-- CreateIndex
CREATE INDEX "SalesOpportunity_status_idx" ON "SalesOpportunity"("status");

-- CreateIndex
CREATE INDEX "SalesOrder_opportunityId_idx" ON "SalesOrder"("opportunityId");

-- CreateIndex
CREATE INDEX "SalesOrder_clientId_idx" ON "SalesOrder"("clientId");

-- CreateIndex
CREATE INDEX "SalesOrder_createdAt_idx" ON "SalesOrder"("createdAt");

-- CreateIndex
CREATE INDEX "SampleRecord_projectId_idx" ON "SampleRecord"("projectId");

-- CreateIndex
CREATE INDEX "SampleRecord_vendorId_idx" ON "SampleRecord"("vendorId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- AddForeignKey
ALTER TABLE "SalesOpportunity" ADD CONSTRAINT "SalesOpportunity_varietyId_fkey" FOREIGN KEY ("varietyId") REFERENCES "CommodityVariety"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcurementProject" ADD CONSTRAINT "ProcurementProject_varietyId_fkey" FOREIGN KEY ("varietyId") REFERENCES "CommodityVariety"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Todo" ADD CONSTRAINT "Todo_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoteReply" ADD CONSTRAINT "NoteReply_todoId_fkey" FOREIGN KEY ("todoId") REFERENCES "Todo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoteReply" ADD CONSTRAINT "NoteReply_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
