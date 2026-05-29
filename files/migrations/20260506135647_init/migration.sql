-- CreateEnum
CREATE TYPE "TipoUsuario" AS ENUM ('ALUNO', 'DOCENTE', 'ADMIN');

-- CreateTable
CREATE TABLE "areas_conhecimento" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,

    CONSTRAINT "areas_conhecimento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cursos" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "areaConhecimentoId" TEXT NOT NULL,

    CONSTRAINT "cursos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disciplinas" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "cursoId" TEXT NOT NULL,

    CONSTRAINT "disciplinas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "temas" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "disciplinaId" TEXT NOT NULL,

    CONSTRAINT "temas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "tipo" "TipoUsuario" NOT NULL DEFAULT 'ALUNO',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "areaConhecimentoId" TEXT,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "docente_cursos" (
    "id" TEXT NOT NULL,
    "docenteId" TEXT NOT NULL,
    "cursoId" TEXT NOT NULL,

    CONSTRAINT "docente_cursos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materiais" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "arquivoUrl" TEXT NOT NULL,
    "tipoArquivo" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "deletadoEm" TIMESTAMP(3),
    "docenteId" TEXT NOT NULL,
    "cursoId" TEXT NOT NULL,
    "disciplinaId" TEXT,
    "temaId" TEXT,

    CONSTRAINT "materiais_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "areas_conhecimento_nome_key" ON "areas_conhecimento"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "usuarios_email_idx" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "usuarios_tipo_idx" ON "usuarios"("tipo");

-- CreateIndex
CREATE INDEX "docente_cursos_docenteId_idx" ON "docente_cursos"("docenteId");

-- CreateIndex
CREATE INDEX "docente_cursos_cursoId_idx" ON "docente_cursos"("cursoId");

-- CreateIndex
CREATE UNIQUE INDEX "docente_cursos_docenteId_cursoId_key" ON "docente_cursos"("docenteId", "cursoId");

-- CreateIndex
CREATE INDEX "materiais_titulo_idx" ON "materiais"("titulo");

-- CreateIndex
CREATE INDEX "materiais_descricao_idx" ON "materiais"("descricao");

-- CreateIndex
CREATE INDEX "materiais_docenteId_idx" ON "materiais"("docenteId");

-- CreateIndex
CREATE INDEX "materiais_cursoId_idx" ON "materiais"("cursoId");

-- CreateIndex
CREATE INDEX "materiais_deletadoEm_idx" ON "materiais"("deletadoEm");

-- AddForeignKey
ALTER TABLE "cursos" ADD CONSTRAINT "cursos_areaConhecimentoId_fkey" FOREIGN KEY ("areaConhecimentoId") REFERENCES "areas_conhecimento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disciplinas" ADD CONSTRAINT "disciplinas_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "cursos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "temas" ADD CONSTRAINT "temas_disciplinaId_fkey" FOREIGN KEY ("disciplinaId") REFERENCES "disciplinas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_areaConhecimentoId_fkey" FOREIGN KEY ("areaConhecimentoId") REFERENCES "areas_conhecimento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "docente_cursos" ADD CONSTRAINT "docente_cursos_docenteId_fkey" FOREIGN KEY ("docenteId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "docente_cursos" ADD CONSTRAINT "docente_cursos_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "cursos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materiais" ADD CONSTRAINT "materiais_docenteId_fkey" FOREIGN KEY ("docenteId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materiais" ADD CONSTRAINT "materiais_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "cursos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materiais" ADD CONSTRAINT "materiais_disciplinaId_fkey" FOREIGN KEY ("disciplinaId") REFERENCES "disciplinas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materiais" ADD CONSTRAINT "materiais_temaId_fkey" FOREIGN KEY ("temaId") REFERENCES "temas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
