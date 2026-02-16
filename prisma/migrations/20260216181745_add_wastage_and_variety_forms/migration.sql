-- AlterTable
ALTER TABLE "Commodity" ADD COLUMN     "wastagePercentage" DOUBLE PRECISION NOT NULL DEFAULT 0.0;

-- AlterTable
ALTER TABLE "CommodityVariety" ADD COLUMN     "wastagePercentage" DOUBLE PRECISION NOT NULL DEFAULT 0.0;

-- CreateTable
CREATE TABLE "VarietyForm" (
    "id" TEXT NOT NULL,
    "varietyId" TEXT NOT NULL,
    "formName" TEXT NOT NULL,
    "yieldPercentage" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    "wastagePercentage" DOUBLE PRECISION NOT NULL DEFAULT 0.0,

    CONSTRAINT "VarietyForm_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VarietyForm_varietyId_formName_key" ON "VarietyForm"("varietyId", "formName");

-- AddForeignKey
ALTER TABLE "VarietyForm" ADD CONSTRAINT "VarietyForm_varietyId_fkey" FOREIGN KEY ("varietyId") REFERENCES "CommodityVariety"("id") ON DELETE CASCADE ON UPDATE CASCADE;
