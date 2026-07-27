-- CreateTable
CREATE TABLE "medida" (
    "id" SERIAL NOT NULL,
    "co_mun" VARCHAR(7) NOT NULL,
    "no_mun" TEXT NOT NULL,
    "ano" SMALLINT NOT NULL,
    "fonte" TEXT NOT NULL,
    "variavel" TEXT NOT NULL,
    "ensino_rede" TEXT NOT NULL,
    "ensino_tipo" TEXT NOT NULL,
    "valor" DECIMAL(14,4) NOT NULL,

    CONSTRAINT "medida_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_medida_agregacao" ON "medida"("ano", "variavel", "ensino_rede", "ensino_tipo");

-- CreateIndex
CREATE INDEX "idx_medida_municipio" ON "medida"("co_mun");
