/*
  Warnings:

  - A unique constraint covering the columns `[nom]` on the table `Classe` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Classe_nom_key" ON "Classe"("nom");
