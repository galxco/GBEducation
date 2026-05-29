import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";

// =============================================================
//  Schemas Zod
// =============================================================

const schemaTema = z.object({
  nome: z
    .string({ required_error: "Nome é obrigatório." })
    .min(2, "Nome deve ter no mínimo 2 caracteres.")
    .max(150, "Nome deve ter no máximo 150 caracteres."),
  descricao: z
    .string()
    .max(500, "Descrição deve ter no máximo 500 caracteres.")
    .optional(),
  disciplinaId: z
    .string({ required_error: "Disciplina é obrigatória." })
    .uuid("ID de disciplina inválido."),
});

const schemaTemaUpdate = schemaTema.partial();

// =============================================================
//  GET /api/temas — aceita ?disciplinaId=
// =============================================================

export async function listarTemas(req: Request, res: Response): Promise<void> {
  const { disciplinaId } = req.query;

  try {
    const temas = await prisma.tema.findMany({
      where: disciplinaId ? { disciplinaId: String(disciplinaId) } : undefined,
      orderBy: { nome: "asc" },
      include: {
        disciplina: {
          select: {
            id: true,
            nome: true,
            curso: {
              select: {
                id: true,
                nome: true,
                area: { select: { id: true, nome: true } },
              },
            },
          },
        },
        _count: { select: { materiais: true } },
      },
    });

    res.status(200).json({
      sucesso: true,
      mensagem: "Temas listados com sucesso.",
      dados: temas,
    });
  } catch (err) {
    console.error("[TEMAS] Erro ao listar:", err);
    res.status(500).json({ sucesso: false, mensagem: "Erro interno no servidor.", dados: null });
  }
}

// =============================================================
//  POST /api/temas
// =============================================================

export async function criarTema(req: Request, res: Response): Promise<void> {
  const resultado = schemaTema.safeParse(req.body);
  if (!resultado.success) {
    res.status(400).json({
      sucesso: false,
      mensagem: "Dados inválidos.",
      dados: resultado.error.flatten().fieldErrors,
    });
    return;
  }

  const { nome, descricao, disciplinaId } = resultado.data;

  try {
    const disciplinaExiste = await prisma.disciplina.findUnique({
      where: { id: disciplinaId },
    });
    if (!disciplinaExiste) {
      res.status(404).json({ sucesso: false, mensagem: "Disciplina não encontrada.", dados: null });
      return;
    }

    const tema = await prisma.tema.create({
      data: { nome, descricao, disciplinaId },
      include: {
        disciplina: { select: { id: true, nome: true } },
      },
    });

    res.status(201).json({ sucesso: true, mensagem: "Tema criado com sucesso.", dados: tema });
  } catch (err) {
    console.error("[TEMAS] Erro ao criar:", err);
    res.status(500).json({ sucesso: false, mensagem: "Erro interno no servidor.", dados: null });
  }
}

// =============================================================
//  PUT /api/temas/:id
// =============================================================

export async function atualizarTema(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const resultado = schemaTemaUpdate.safeParse(req.body);
  if (!resultado.success) {
    res.status(400).json({
      sucesso: false,
      mensagem: "Dados inválidos.",
      dados: resultado.error.flatten().fieldErrors,
    });
    return;
  }

  try {
    const existe = await prisma.tema.findUnique({ where: { id } });
    if (!existe) {
      res.status(404).json({ sucesso: false, mensagem: "Tema não encontrado.", dados: null });
      return;
    }

    if (resultado.data.disciplinaId) {
      const disciplinaExiste = await prisma.disciplina.findUnique({
        where: { id: resultado.data.disciplinaId },
      });
      if (!disciplinaExiste) {
        res.status(404).json({ sucesso: false, mensagem: "Disciplina não encontrada.", dados: null });
        return;
      }
    }

    const tema = await prisma.tema.update({
      where: { id },
      data: resultado.data,
      include: { disciplina: { select: { id: true, nome: true } } },
    });

    res.status(200).json({ sucesso: true, mensagem: "Tema atualizado com sucesso.", dados: tema });
  } catch (err) {
    console.error("[TEMAS] Erro ao atualizar:", err);
    res.status(500).json({ sucesso: false, mensagem: "Erro interno no servidor.", dados: null });
  }
}

// =============================================================
//  DELETE /api/temas/:id
// =============================================================

export async function deletarTema(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    const existe = await prisma.tema.findUnique({
      where: { id },
      include: { _count: { select: { materiais: true } } },
    });

    if (!existe) {
      res.status(404).json({ sucesso: false, mensagem: "Tema não encontrado.", dados: null });
      return;
    }

    if (existe._count.materiais > 0) {
      res.status(409).json({
        sucesso: false,
        mensagem: `Não é possível excluir. Existem ${existe._count.materiais} material(is) vinculado(s) a este tema.`,
        dados: null,
      });
      return;
    }

    await prisma.tema.delete({ where: { id } });

    res.status(200).json({ sucesso: true, mensagem: "Tema excluído com sucesso.", dados: null });
  } catch (err) {
    console.error("[TEMAS] Erro ao deletar:", err);
    res.status(500).json({ sucesso: false, mensagem: "Erro interno no servidor.", dados: null });
  }
}
