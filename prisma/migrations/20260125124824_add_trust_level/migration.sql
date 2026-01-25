-- CreateEnum
CREATE TYPE "TrustLevel" AS ENUM ('UNRATED', 'LOW', 'MEDIUM', 'HIGH', 'VERIFIED');

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "trustLevel" "TrustLevel" NOT NULL DEFAULT 'UNRATED';
