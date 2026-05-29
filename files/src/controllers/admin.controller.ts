import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { TipoUsuario } from "../types/enums";

// =============================================================
//  GET /api/admin/stats
// =============================================================

export async function getStats(_req: Request, res: Response): Promise<void> {
  try {
    const [
      totalAreas,
      totalCursos,
      totalDisciplinas,
      totalTemas,
      totalMateriais,
      totalDocentes,
      totalAlunos,
    ] = await Promise.all([
      prisma.areaConhecimento.count(),
      prisma.curso.count(),
      prisma.disciplina.count(),
      prisma.tema.count(),
      prisma.material.count({ where: { deletadoEm: null } }),
      prisma.usuario.count({ where: { tipo: TipoUsuario.DOCENTE } }),
      prisma.usuario.count({ where: { tipo: TipoUsuario.ALUNO } }),
    ]);

    res.status(200).json({
      sucesso: true,
      mensagem: "Estatísticas carregadas.",
      dados: {
        totalAreas,
        totalCursos,
        totalDisciplinas,
        totalTemas,
        totalMateriais,
        totalDocentes,
        totalAlunos,
      },
    });
  } catch (err) {
    console.error("[ADMIN] Erro ao buscar stats:", err);
    res.status(500).json({ sucesso: false, mensagem: "Erro interno.", dados: null });
  }
}
