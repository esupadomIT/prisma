/*
  Warnings:

  - You are about to drop the column `commentaire` on the `Devis` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Devis" DROP COLUMN "commentaire",
ADD COLUMN     "comment" TEXT;
