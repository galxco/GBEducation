import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";

// =============================================================
//  Schemas Zod
// =============================================================

const schemaArea = z.object({
  nome: z
    .string({ required_error: "Nome é obrigatório." })
    .min(2, "Nome deve ter no mínimo 2 caracteres.")
    .max(100, "Nome deve ter no máximo 100 caracteres."),
  descricao: z
    .string()
    .max(500, "Descrição deve ter no máximo 500 caracteres.")
    .optional(),
});

const schemaAreaUpdate = schemaArea.partial();

// =============================================================
//  GET /api/areas
// =============================================================

export async function listarAreas(req: Request, res: Response): Promise<void> {
  try {
    const areas = await prisma.areaConhecimento.findMany({
      orderBy: { nome: "asc" },
      include: {
        _count: { select: { cursos: true, usuarios: true } },
      },
    });

    res.status(200).json({
      sucesso: true,
      mensagem: "Áreas de conhecimento listadas com sucesso.",
      dados: areas,
    });
  } catch (err) {
    console.error("[AREAS] Erro ao listar:", err);
    res.status(500).json({ sucesso: false, mensagem: "Erro interno no servidor.", dados: null });
  }
}

// =============================================================
//  POST /api/areas
// =============================================================

export async function criarArea(req: Request, res: Response): Promise<void> {
  const resultado = schemaArea.safeParse(req.body);
  if (!resultado.success) {
    res.status(400).json({
      sucesso: false,
      mensagem: "Dados inválidos.",
      dados: resultado.error.flatten().fieldErrors,
    });
    return;
  }

  const { nome, descricao } = resultado.data;

  try {
    const jaExiste = await prisma.areaConhecimento.findUnique({ where: { nome } });
    if (jaExiste) {
      res.status(409).json({ sucesso: false, mensagem: "Já existe uma área com esse nome.", dados: null });
      return;
    }

    const area = await prisma.areaConhecimento.create({
      data: { nome, descricao },
    });

    res.status(201).json({ sucesso: true, mensagem: "Área criada com sucesso.", dados: area });
  } catch (err) {
    console.error("[AREAS] Erro ao criar:", err);
    res.status(500).json({ sucesso: false, mensagem: "Erro interno no servidor.", dados: null });
  }
}

// =============================================================
//  PUT /api/areas/:id
// =============================================================

export async function atualizarArea(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const resultado = schemaAreaUpdate.safeParse(req.body);
  if (!resultado.success) {
    res.status(400).json({
      sucesso: false,
      mensagem: "Dados inválidos.",
      dados: resultado.error.flatten().fieldErrors,
    });
    return;
  }

  try {
    const existe = await prisma.areaConhecimento.findUnique({ where: { id } });
    if (!existe) {
      res.status(404).json({ sucesso: false, mensagem: "Área não encontrada.", dados: null });
      return;
    }

    // Verifica duplicidade de nome (se estiver sendo alterado)
    if (resultado.data.nome && resultado.data.nome !== existe.nome) {
      const nomeEmUso = await prisma.areaConhecimento.findUnique({
        where: { nome: resultado.data.nome },
      });
      if (nomeEmUso) {
        res.status(409).json({ sucesso: false, mensagem: "Já existe uma área com esse nome.", dados: null });
        return;
      }
    }

    const area = await prisma.areaConhecimento.update({
      where: { id },
      data: resultado.data,
    });

    res.status(200).json({ sucesso: true, mensagem: "Área atualizada com sucesso.", dados: area });
  } catch (err) {
    console.error("[AREAS] Erro ao atualizar:", err);
    res.status(500).json({ sucesso: false, mensagem: "Erro interno no servidor.", dados: null });
  }
}

// =============================================================
//  DELETE /api/areas/:id
// =============================================================

export async function deletarArea(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    const existe = await prisma.areaConhecimento.findUnique({
      where: { id },
      include: { _count: { select: { cursos: true } } },
    });

    if (!existe) {
      res.status(404).json({ sucesso: false, mensagem: "Área não encontrada.", dados: null });
      return;
    }

    // Bloqueia se houver cursos vinculados
    if (existe._count.cursos > 0) {
      res.status(409).json({
        sucesso: false,
        mensagem: `Não é possível excluir. Existem ${existe._count.cursos} curso(s) vinculado(s) a esta área.`,
        dados: null,
      });
      return;
    }

    await prisma.areaConhecimento.delete({ where: { id } });

    res.status(200).json({ sucesso: true, mensagem: "Área excluída com sucesso.", dados: null });
  } catch (err) {
    console.error("[AREAS] Erro ao deletar:", err);
    res.status(500).json({ sucesso: false, mensagem: "Erro interno no servidor.", dados: null });
  }
}
