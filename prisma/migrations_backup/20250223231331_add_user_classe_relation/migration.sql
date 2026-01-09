-- CreateTable
CREATE TABLE "UserClasse" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "classeId" INTEGER NOT NULL,

    CONSTRAINT "UserClasse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserClasse_userId_classeId_key" ON "UserClasse"("userId", "classeId");

-- AddForeignKey
ALTER TABLE "UserClasse" ADD CONSTRAINT "UserClasse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserClasse" ADD CONSTRAINT "UserClasse_classeId_fkey" FOREIGN KEY ("classeId") REFERENCES "Classe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
