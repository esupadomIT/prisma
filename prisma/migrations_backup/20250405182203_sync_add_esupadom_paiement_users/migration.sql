/*
  Warnings:

  - A unique constraint covering the columns `[token]` on the table `EsupadomPaiementUsers` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "EsupadomPaiementUsers" ALTER COLUMN "token" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "EsupadomPaiementUsers_token_key" ON "EsupadomPaiementUsers"("token");
