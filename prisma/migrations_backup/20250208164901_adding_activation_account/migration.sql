-- AlterTable
ALTER TABLE "User" ADD COLUMN     "activationExpiry" TIMESTAMP(3),
ADD COLUMN     "activationToken" TEXT;
