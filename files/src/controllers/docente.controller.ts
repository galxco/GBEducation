import { Request, Response } from "express";
import { z } from "zod";
import path from "path";
import fs from "fs";
import { prisma } from "../lib/prisma";
import { MIME_PERMITIDOS, UPLOAD_DIR } from "../lib/multer";

// =============================================================
//  Schemas Zod
// =============================================================

const schemaMaterial = z.object({
  titulo: z
    .string({ required_error: "Título é obrigatório." })
    .min(3, "Título deve ter no mínimo 3 caracteres.")
    .max(200, "Título deve ter no máximo 200 caracteres."),
  descricao: z.string().max(1000).optional(),
  cursoId: z
    .string({ required_error: "Curso é obrigatório." })
    .uuid("ID de curso inválido."),
  disciplinaId: z.string().uuid("ID de disciplina inválido.").optional(),
  temaId: z.string().uuid("ID de tema inválido.").optional(),
});

const schemaMaterialUpdate = schemaMaterial.partial();

// =============================================================
//  GET /api/docente/cursos
// =============================================================

export async function listarMeusCursos(req: Request, res: Response): Promise<void> {
  try {
    const vinculos = await prisma.docenteCurso.findMany({
      where: { docenteId: req.usuario!.id },
      include: {
        curso: {
          include: {
            area: { select: { id: true, nome: true } },
            _count: { select: { disciplinas: true, materiais: true } },
          },
        },
      },
      orderBy: { curso: { nome: "asc" } },
    });

    const cursos = vinculos.map((v: { curso: typeof vinculos[0]["curso"] }) => v.curso);

    res.status(200).json({
      sucesso: true,
      mensagem: "Cursos listados com sucesso.",
      dados: cursos,
    });
  } catch (err) {
    console.error("[DOCENTE] Erro ao listar cursos:", err);
    res.status(500).json({ sucesso: false, mensagem: "Erro interno no servidor.", dados: null });
  }
}

// =============================================================
//  POST /api/docente/cursos — vincula docente a um curso
// =============================================================

export async function vincularCurso(req: Request, res: Response): Promise<void> {
  const { cursoId } = req.body;

  if (!cursoId || typeof cursoId !== "string") {
    res.status(400).json({ sucesso: false, mensagem: "cursoId é obrigatório.", dados: null });
    return;
  }

  try {
    const curso = await prisma.curso.findUnique({ where: { id: cursoId } });
    if (!curso) {
      res.status(404).json({ sucesso: false, mensagem: "Curso não encontrado.", dados: null });
      return;
    }

    const jaVinculado = await prisma.docenteCurso.findUnique({
      where: { docenteId_cursoId: { docenteId: req.usuario!.id, cursoId } },
    });
    if (jaVinculado) {
      res.status(409).json({ sucesso: false, mensagem: "Você já está vinculado a este curso.", dados: null });
      return;
    }

    const vinculo = await prisma.docenteCurso.create({
      data: { docenteId: req.usuario!.id, cursoId },
      include: { curso: { select: { id: true, nome: true } } },
    });

    res.status(201).json({ sucesso: true, mensagem: "Vínculo criado com sucesso.", dados: vinculo });
  } catch (err) {
    console.error("[DOCENTE] Erro ao vincular curso:", err);
    res.status(500).json({ sucesso: false, mensagem: "Erro interno no servidor.", dados: null });
  }
}

// =============================================================
//  DELETE /api/docente/cursos/:cursoId — desvincula
// =============================================================

export async function desvincularCurso(req: Request, res: Response): Promise<void> {
  const { cursoId } = req.params;

  try {
    const vinculo = await prisma.docenteCurso.findUnique({
      where: { docenteId_cursoId: { docenteId: req.usuario!.id, cursoId } },
    });

    if (!vinculo) {
      res.status(404).json({ sucesso: false, mensagem: "Vínculo não encontrado.", dados: null });
      return;
    }

    await prisma.docenteCurso.delete({
      where: { docenteId_cursoId: { docenteId: req.usuario!.id, cursoId } },
    });

    res.status(200).json({ sucesso: true, mensagem: "Desvinculado com sucesso.", dados: null });
  } catch (err) {
    console.error("[DOCENTE] Erro ao desvincular curso:", err);
    res.status(500).json({ sucesso: false, mensagem: "Erro interno no servidor.", dados: null });
  }
}

// =============================================================
//  GET /api/materiais/meus — materiais do docente logado
// =============================================================

export async function listarMeusMateriais(req: Request, res: Response): Promise<void> {
  try {
    const materiais = await prisma.material.findMany({
      where: {
        docenteId: req.usuario!.id,
        deletadoEm: null,
      },
      include: {
        curso: { select: { id: true, nome: true } },
        disciplina: { select: { id: true, nome: true } },
        tema: { select: { id: true, nome: true } },
      },
      orderBy: { criadoEm: "desc" },
    });

    res.status(200).json({
      sucesso: true,
      mensagem: "Materiais listados com sucesso.",
      dados: materiais,
    });
  } catch (err) {
    console.error("[DOCENTE] Erro ao listar materiais:", err);
    res.status(500).json({ sucesso: false, mensagem: "Erro interno no servidor.", dados: null });
  }
}

// =============================================================
//  POST /api/materiais — upload de material
// =============================================================

export async function criarMaterial(req: Request, res: Response): Promise<void> {
  // Multer já processou o arquivo — req.file estará disponível
  if (!req.file) {
    res.status(400).json({ sucesso: false, mensagem: "Arquivo é obrigatório.", dados: null });
    return;
  }

  const resultado = schemaMaterial.safeParse(req.body);
  if (!resultado.success) {
    // Remove arquivo se validação falhar
    fs.unlink(req.file.path, () => {});
    res.status(400).json({
      sucesso: false,
      mensagem: "Dados inválidos.",
      dados: resultado.error.flatten().fieldErrors,
    });
    return;
  }

  const { titulo, descricao, cursoId, disciplinaId, temaId } = resultado.data;

  try {
    // Verifica se o docente está vinculado ao curso
    const vinculo = await prisma.docenteCurso.findUnique({
      where: { docenteId_cursoId: { docenteId: req.usuario!.id, cursoId } },
    });
    if (!vinculo) {
      fs.unlink(req.file.path, () => {});
      res.status(403).json({
        sucesso: false,
        mensagem: "Você não está vinculado a este curso.",
        dados: null,
      });
      return;
    }

    const tipoArquivo = MIME_PERMITIDOS[req.file.mimetype] ?? "OUTRO";
    const arquivoUrl = `/uploads/${req.file.filename}`;

    const material = await prisma.material.create({
      data: {
        titulo,
        descricao,
        arquivoUrl,
        tipoArquivo,
        tamanhoBytes: req.file.size,
        docenteId: req.usuario!.id,
        cursoId,
        disciplinaId: disciplinaId ?? null,
        temaId: temaId ?? null,
      },
      include: {
        curso: { select: { id: true, nome: true } },
        disciplina: { select: { id: true, nome: true } },
        tema: { select: { id: true, nome: true } },
      },
    });

    res.status(201).json({ sucesso: true, mensagem: "Material enviado com sucesso.", dados: material });
  } catch (err) {
    fs.unlink(req.file.path, () => {});
    console.error("[DOCENTE] Erro ao criar material:", err);
    res.status(500).json({ sucesso: false, mensagem: "Erro interno no servidor.", dados: null });
  }
}

// =============================================================
//  PUT /api/materiais/:id — editar (só se for dono)
// =============================================================

export async function editarMaterial(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const resultado = schemaMaterialUpdate.safeParse(req.body);
  if (!resultado.success) {
    res.status(400).json({
      sucesso: false,
      mensagem: "Dados inválidos.",
      dados: resultado.error.flatten().fieldErrors,
    });
    return;
  }

  try {
    const material = await prisma.material.findUnique({ where: { id } });

    if (!material || material.deletadoEm) {
      res.status(404).json({ sucesso: false, mensagem: "Material não encontrado.", dados: null });
      return;
    }

    if (material.docenteId !== req.usuario!.id) {
      res.status(403).json({ sucesso: false, mensagem: "Você não tem permissão para editar este material.", dados: null });
      return;
    }

    const atualizado = await prisma.material.update({
      where: { id },
      data: resultado.data,
      include: {
        curso: { select: { id: true, nome: true } },
        disciplina: { select: { id: true, nome: true } },
        tema: { select: { id: true, nome: true } },
      },
    });

    res.status(200).json({ sucesso: true, mensagem: "Material atualizado com sucesso.", dados: atualizado });
  } catch (err) {
    console.error("[DOCENTE] Erro ao editar material:", err);
    res.status(500).json({ sucesso: false, mensagem: "Erro interno no servidor.", dados: null });
  }
}

// =============================================================
//  DELETE /api/materiais/:id — soft delete (só se for dono)
// =============================================================

export async function deletarMaterial(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    const material = await prisma.material.findUnique({ where: { id } });

    if (!material || material.deletadoEm) {
      res.status(404).json({ sucesso: false, mensagem: "Material não encontrado.", dados: null });
      return;
    }

    if (material.docenteId !== req.usuario!.id) {
      res.status(403).json({ sucesso: false, mensagem: "Você não tem permissão para excluir este material.", dados: null });
      return;
    }

    await prisma.material.update({
      where: { id },
      data: { deletadoEm: new Date() },
    });

    res.status(200).json({ sucesso: true, mensagem: "Material removido com sucesso.", dados: null });
  } catch (err) {
    console.error("[DOCENTE] Erro ao deletar material:", err);
    res.status(500).json({ sucesso: false, mensagem: "Erro interno no servidor.", dados: null });
  }
}
