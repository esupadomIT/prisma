-- CreateTable
CREATE TABLE "Devis" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "classId" INTEGER NOT NULL,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Devis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_DevisMatieres" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_DevisMatieres_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "Devis_classId_idx" ON "Devis"("classId");

-- CreateIndex
CREATE INDEX "_DevisMatieres_B_index" ON "_DevisMatieres"("B");

-- AddForeignKey
ALTER TABLE "Devis" ADD CONSTRAINT "Devis_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Classe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DevisMatieres" ADD CONSTRAINT "_DevisMatieres_A_fkey" FOREIGN KEY ("A") REFERENCES "Devis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DevisMatieres" ADD CONSTRAINT "_DevisMatieres_B_fkey" FOREIGN KEY ("B") REFERENCES "Matiere"("id") ON DELETE CASCADE ON UPDATE CASCADE;
