-- AlterTable
ALTER TABLE "AuditLog" ALTER COLUMN "entityId" DROP NOT NULL,
ALTER COLUMN "initiatedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "passportNumber" TEXT;
