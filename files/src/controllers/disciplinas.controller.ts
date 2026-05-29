import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";

// =============================================================
//  Schemas Zod
// =============================================================

const schemaDisciplina = z.object({
  nome: z
    .string({ required_error: "Nome é obrigatório." })
    .min(2, "Nome deve ter no mínimo 2 caracteres.")
    .max(150, "Nome deve ter no máximo 150 caracteres."),
  descricao: z
    .string()
    .max(500, "Descrição deve ter no máximo 500 caracteres.")
    .optional(),
  cursoId: z
    .string({ required_error: "Curso é obrigatório." })
    .uuid("ID de curso inválido."),
});

const schemaDisciplinaUpdate = schemaDisciplina.partial();

// =============================================================
//  GET /api/disciplinas — aceita ?cursoId=
// =============================================================

export async function listarDisciplinas(req: Request, res: Response): Promise<void> {
  const { cursoId } = req.query;

  try {
    const disciplinas = await prisma.disciplina.findMany({
      where: cursoId ? { cursoId: String(cursoId) } : undefined,
      orderBy: { nome: "asc" },
      include: {
        curso: {
          select: {
            id: true,
            nome: true,
            area: { select: { id: true, nome: true } },
          },
        },
        _count: { select: { temas: true, materiais: true } },
      },
    });

    res.status(200).json({
      sucesso: true,
      mensagem: "Disciplinas listadas com sucesso.",
      dados: disciplinas,
    });
  } catch (err) {
    console.error("[DISCIPLINAS] Erro ao listar:", err);
    res.status(500).json({ sucesso: false, mensagem: "Erro interno no servidor.", dados: null });
  }
}

// =============================================================
//  POST /api/disciplinas
// =============================================================

export async function criarDisciplina(req: Request, res: Response): Promise<void> {
  const resultado = schemaDisciplina.safeParse(req.body);
  if (!resultado.success) {
    res.status(400).json({
      sucesso: false,
      mensagem: "Dados inválidos.",
      dados: resultado.error.flatten().fieldErrors,
    });
    return;
  }

  const { nome, descricao, cursoId } = resultado.data;

  try {
    const cursoExiste = await prisma.curso.findUnique({ where: { id: cursoId } });
    if (!cursoExiste) {
      res.status(404).json({ sucesso: false, mensagem: "Curso não encontrado.", dados: null });
      return;
    }

    const disciplina = await prisma.disciplina.create({
      data: { nome, descricao, cursoId },
      include: {
        curso: { select: { id: true, nome: true } },
      },
    });

    res.status(201).json({ sucesso: true, mensagem: "Disciplina criada com sucesso.", dados: disciplina });
  } catch (err) {
    console.error("[DISCIPLINAS] Erro ao criar:", err);
    res.status(500).json({ sucesso: false, mensagem: "Erro interno no servidor.", dados: null });
  }
}

// =============================================================
//  PUT /api/disciplinas/:id
// =============================================================

export async function atualizarDisciplina(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const resultado = schemaDisciplinaUpdate.safeParse(req.body);
  if (!resultado.success) {
    res.status(400).json({
      sucesso: false,
      mensagem: "Dados inválidos.",
      dados: resultado.error.flatten().fieldErrors,
    });
    return;
  }

  try {
    const existe = await prisma.disciplina.findUnique({ where: { id } });
    if (!existe) {
      res.status(404).json({ sucesso: false, mensagem: "Disciplina não encontrada.", dados: null });
      return;
    }

    if (resultado.data.cursoId) {
      const cursoExiste = await prisma.curso.findUnique({
        where: { id: resultado.data.cursoId },
      });
      if (!cursoExiste) {
        res.status(404).json({ sucesso: false, mensagem: "Curso não encontrado.", dados: null });
        return;
      }
    }

    const disciplina = await prisma.disciplina.update({
      where: { id },
      data: resultado.data,
      include: { curso: { select: { id: true, nome: true } } },
    });

    res.status(200).json({ sucesso: true, mensagem: "Disciplina atualizada com sucesso.", dados: disciplina });
  } catch (err) {
    console.error("[DISCIPLINAS] Erro ao atualizar:", err);
    res.status(500).json({ sucesso: false, mensagem: "Erro interno no servidor.", dados: null });
  }
}

// =============================================================
//  DELETE /api/disciplinas/:id
// =============================================================

export async function deletarDisciplina(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    const existe = await prisma.disciplina.findUnique({
      where: { id },
      include: { _count: { select: { temas: true, materiais: true } } },
    });

    if (!existe) {
      res.status(404).json({ sucesso: false, mensagem: "Disciplina não encontrada.", dados: null });
      return;
    }

    if (existe._count.materiais > 0) {
      res.status(409).json({
        sucesso: false,
        mensagem: `Não é possível excluir. Existem ${existe._count.materiais} material(is) vinculado(s) a esta disciplina.`,
        dados: null,
      });
      return;
    }

    await prisma.disciplina.delete({ where: { id } });

    res.status(200).json({ sucesso: true, mensagem: "Disciplina excluída com sucesso.", dados: null });
  } catch (err) {
    console.error("[DISCIPLINAS] Erro ao deletar:", err);
    res.status(500).json({ sucesso: false, mensagem: "Erro interno no servidor.", dados: null });
  }
}
