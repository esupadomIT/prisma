-- CreateTable
CREATE TABLE "Configs" (
    "id" SERIAL NOT NULL,
    "devise" TEXT NOT NULL,
    "codeCountry" TEXT NOT NULL,
    "priceHour" TEXT NOT NULL,
    "shortWebsiteName" TEXT NOT NULL,

    CONSTRAINT "Configs_pkey" PRIMARY KEY ("id")
);
