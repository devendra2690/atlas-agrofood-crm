-- CreateEnum
CREATE TYPE "SourcingRequestStatus" AS ENUM ('OPEN', 'RESEARCH', 'SAMPLING', 'ONBOARDED', 'UNAVAILABLE');

-- CreateEnum
CREATE TYPE "Sourcingpriority" AS ENUM ('NORMAL', 'URGENT');

-- AlterEnum
ALTER TYPE "PurchaseOrderStatus" ADD VALUE 'CANCELLED';

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommodityVariety" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "commodityId" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "CommodityVariety_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorVariety" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "varietyId" TEXT NOT NULL,
    "originStateId" TEXT,
    "leadTime" TEXT,
    "supplyCapacity" TEXT,
    "qualityGrade" TEXT,
    "isBlacklisted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "VendorVariety_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourcingRequest" (
    "id" TEXT NOT NULL,
    "requestedItem" TEXT NOT NULL,
    "volume" TEXT,
    "salesUserId" TEXT NOT NULL,
    "status" "SourcingRequestStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "Sourcingpriority" NOT NULL DEFAULT 'NORMAL',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SourcingRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CommodityVariety_name_commodityId_key" ON "CommodityVariety"("name", "commodityId");

-- CreateIndex
CREATE UNIQUE INDEX "VendorVariety_vendorId_varietyId_key" ON "VendorVariety"("vendorId", "varietyId");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommodityVariety" ADD CONSTRAINT "CommodityVariety_commodityId_fkey" FOREIGN KEY ("commodityId") REFERENCES "Commodity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorVariety" ADD CONSTRAINT "VendorVariety_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorVariety" ADD CONSTRAINT "VendorVariety_varietyId_fkey" FOREIGN KEY ("varietyId") REFERENCES "CommodityVariety"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorVariety" ADD CONSTRAINT "VendorVariety_originStateId_fkey" FOREIGN KEY ("originStateId") REFERENCES "State"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourcingRequest" ADD CONSTRAINT "SourcingRequest_salesUserId_fkey" FOREIGN KEY ("salesUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
