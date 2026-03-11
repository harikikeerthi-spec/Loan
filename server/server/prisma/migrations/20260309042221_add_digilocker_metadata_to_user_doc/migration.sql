-- AlterTable
ALTER TABLE "UserDocument" ADD COLUMN     "digilockerTxId" TEXT,
ADD COLUMN     "verificationMetadata" JSONB,
ADD COLUMN     "verifiedAt" TIMESTAMP(3);
