-- AlterTable
ALTER TABLE "SalesOpportunity" ADD COLUMN     "varietyFormId" TEXT;

-- AddForeignKey
ALTER TABLE "SalesOpportunity" ADD CONSTRAINT "SalesOpportunity_varietyFormId_fkey" FOREIGN KEY ("varietyFormId") REFERENCES "VarietyForm"("id") ON DELETE SET NULL ON UPDATE CASCADE;
