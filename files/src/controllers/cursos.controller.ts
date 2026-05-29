import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";

// =============================================================
//  Schemas Zod
// =============================================================

const schemaCurso = z.object({
  nome: z
    .string({ required_error: "Nome é obrigatório." })
    .min(2, "Nome deve ter no mínimo 2 caracteres.")
    .max(150, "Nome deve ter no máximo 150 caracteres."),
  descricao: z
    .string()
    .max(500, "Descrição deve ter no máximo 500 caracteres.")
    .optional(),
  areaConhecimentoId: z
    .string({ required_error: "Área de conhecimento é obrigatória." })
    .uuid("ID de área inválido."),
});

const schemaCursoUpdate = schemaCurso.partial();

// =============================================================
//  GET /api/cursos — aceita ?areaId=
// =============================================================

export async function listarCursos(req: Request, res: Response): Promise<void> {
  const { areaId } = req.query;

  try {
    const cursos = await prisma.curso.findMany({
      where: areaId ? { areaConhecimentoId: String(areaId) } : undefined,
      orderBy: { nome: "asc" },
      include: {
        area: { select: { id: true, nome: true } },
        _count: { select: { disciplinas: true, materiais: true, docenteCurso: true } },
      },
    });

    res.status(200).json({
      sucesso: true,
      mensagem: "Cursos listados com sucesso.",
      dados: cursos,
    });
  } catch (err) {
    console.error("[CURSOS] Erro ao listar:", err);
    res.status(500).json({ sucesso: false, mensagem: "Erro interno no servidor.", dados: null });
  }
}

// =============================================================
//  POST /api/cursos
// =============================================================

export async function criarCurso(req: Request, res: Response): Promise<void> {
  const resultado = schemaCurso.safeParse(req.body);
  if (!resultado.success) {
    res.status(400).json({
      sucesso: false,
      mensagem: "Dados inválidos.",
      dados: resultado.error.flatten().fieldErrors,
    });
    return;
  }

  const { nome, descricao, areaConhecimentoId } = resultado.data;

  try {
    const areaExiste = await prisma.areaConhecimento.findUnique({
      where: { id: areaConhecimentoId },
    });
    if (!areaExiste) {
      res.status(404).json({ sucesso: false, mensagem: "Área de conhecimento não encontrada.", dados: null });
      return;
    }

    const curso = await prisma.curso.create({
      data: { nome, descricao, areaConhecimentoId },
      include: { area: { select: { id: true, nome: true } } },
    });

    res.status(201).json({ sucesso: true, mensagem: "Curso criado com sucesso.", dados: curso });
  } catch (err) {
    console.error("[CURSOS] Erro ao criar:", err);
    res.status(500).json({ sucesso: false, mensagem: "Erro interno no servidor.", dados: null });
  }
}

// =============================================================
//  PUT /api/cursos/:id
// =============================================================

export async function atualizarCurso(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const resultado = schemaCursoUpdate.safeParse(req.body);
  if (!resultado.success) {
    res.status(400).json({
      sucesso: false,
      mensagem: "Dados inválidos.",
      dados: resultado.error.flatten().fieldErrors,
    });
    return;
  }

  try {
    const existe = await prisma.curso.findUnique({ where: { id } });
    if (!existe) {
      res.status(404).json({ sucesso: false, mensagem: "Curso não encontrado.", dados: null });
      return;
    }

    // Valida nova área se estiver sendo alterada
    if (resultado.data.areaConhecimentoId) {
      const areaExiste = await prisma.areaConhecimento.findUnique({
        where: { id: resultado.data.areaConhecimentoId },
      });
      if (!areaExiste) {
        res.status(404).json({ sucesso: false, mensagem: "Área de conhecimento não encontrada.", dados: null });
        return;
      }
    }

    const curso = await prisma.curso.update({
      where: { id },
      data: resultado.data,
      include: { area: { select: { id: true, nome: true } } },
    });

    res.status(200).json({ sucesso: true, mensagem: "Curso atualizado com sucesso.", dados: curso });
  } catch (err) {
    console.error("[CURSOS] Erro ao atualizar:", err);
    res.status(500).json({ sucesso: false, mensagem: "Erro interno no servidor.", dados: null });
  }
}

// =============================================================
//  DELETE /api/cursos/:id
// =============================================================

export async function deletarCurso(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    const existe = await prisma.curso.findUnique({
      where: { id },
      include: {
        _count: { select: { materiais: true } },
      },
    });

    if (!existe) {
      res.status(404).json({ sucesso: false, mensagem: "Curso não encontrado.", dados: null });
      return;
    }

    // Bloqueia se houver materiais vinculados
    if (existe._count.materiais > 0) {
      res.status(409).json({
        sucesso: false,
        mensagem: `Não é possível excluir. Existem ${existe._count.materiais} material(is) vinculado(s) a este curso.`,
        dados: null,
      });
      return;
    }

    await prisma.curso.delete({ where: { id } });

    res.status(200).json({ sucesso: true, mensagem: "Curso excluído com sucesso.", dados: null });
  } catch (err) {
    console.error("[CURSOS] Erro ao deletar:", err);
    res.status(500).json({ sucesso: false, mensagem: "Erro interno no servidor.", dados: null });
  }
}
