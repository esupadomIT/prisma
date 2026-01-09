/*
  Warnings:

  - You are about to drop the column `detailForfait` on the `Seance` table. All the data in the column will be lost.
  - You are about to drop the column `nomForfait` on the `Seance` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Seance" DROP COLUMN "detailForfait",
DROP COLUMN "nomForfait";
