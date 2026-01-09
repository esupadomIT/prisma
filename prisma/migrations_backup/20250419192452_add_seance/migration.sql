-- CreateTable
CREATE TABLE "Seance" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "horaire" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "matiere" TEXT NOT NULL,
    "typeForfait" TEXT NOT NULL,
    "nomForfait" TEXT NOT NULL,
    "detailForfait" TEXT,
    "instructorId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Seance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_SeanceStudents" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_SeanceStudents_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_SeanceStudents_B_index" ON "_SeanceStudents"("B");

-- AddForeignKey
ALTER TABLE "Seance" ADD CONSTRAINT "Seance_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SeanceStudents" ADD CONSTRAINT "_SeanceStudents_A_fkey" FOREIGN KEY ("A") REFERENCES "Seance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SeanceStudents" ADD CONSTRAINT "_SeanceStudents_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
