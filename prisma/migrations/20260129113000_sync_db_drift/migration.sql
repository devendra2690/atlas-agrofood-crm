-- CreateEnum
CREATE TYPE "ProcurementType" AS ENUM ('PROJECT', 'SAMPLE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "OpportunityStatus" ADD VALUE 'QUALIFICATION';
ALTER TYPE "OpportunityStatus" ADD VALUE 'PROPOSAL';
ALTER TYPE "OpportunityStatus" ADD VALUE 'NEGOTIATION';

-- DropForeignKey
ALTER TABLE "Shipment" DROP CONSTRAINT "Shipment_purchaseOrderId_fkey";

-- DropIndex
DROP INDEX "Shipment_purchaseOrderId_key";

-- AlterTable
ALTER TABLE "Bill" ADD COLUMN     "notes" TEXT;

-- AlterTable
ALTER TABLE "ProcurementProject" ADD COLUMN     "type" "ProcurementType" NOT NULL DEFAULT 'PROJECT';

-- AlterTable
ALTER TABLE "SalesOrder" ADD COLUMN     "fulfillmentNotes" TEXT;

-- AlterTable
ALTER TABLE "Shipment" ADD COLUMN     "quantity" DECIMAL(65,30),
ADD COLUMN     "salesOrderId" TEXT,
ALTER COLUMN "purchaseOrderId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Todo" ADD COLUMN     "dueDate" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
