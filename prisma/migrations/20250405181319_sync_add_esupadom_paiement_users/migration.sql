-- CreateTable
CREATE TABLE "EsupadomPaiementUsers" (
    "id" SERIAL NOT NULL,
    "gender" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EsupadomPaiementUsers_pkey" PRIMARY KEY ("id")
);
