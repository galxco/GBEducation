import { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { prisma } from "../lib/prisma";
import { UPLOAD_DIR } from "../lib/multer";

// =============================================================
//  GET /api/materiais — lista paginada filtrada pela área do aluno
// =============================================================

export async function listarMateriais(req: Request, res: Response): Promise<void> {
  const areaId = req.usuario!.areaConhecimentoId;

  if (!areaId) {
    res.status(400).json({
      sucesso: false,
      mensagem: "Sua conta não está vinculada a uma área de conhecimento.",
      dados: null,
    });
    return;
  }

  // Query params
  const cursoId   = req.query.cursoId   ? String(req.query.cursoId)   : undefined;
  const temaId    = req.query.temaId    ? String(req.query.temaId)    : undefined;
  const busca     = req.query.busca     ? String(req.query.busca)     : undefined;
  const pagina    = Math.max(1, parseInt(String(req.query.pagina  ?? "1"),  10));
  const limite    = Math.min(50, Math.max(1, parseInt(String(req.query.limite ?? "10"), 10)));
  const skip      = (pagina - 1) * limite;

  try {
    // Monta filtro base: materiais ativos da área do aluno
    const where = {
      deletadoEm: null,
      curso: { areaConhecimentoId: areaId },
      ...(cursoId && { cursoId }),
      ...(temaId  && { temaId }),
      ...(busca && {
        OR: [
          { titulo:    { contains: busca, mode: "insensitive" as const } },
          { descricao: { contains: busca, mode: "insensitive" as const } },
        ],
      }),
    };

    const [total, materiais] = await Promise.all([
      prisma.material.count({ where }),
      prisma.material.findMany({
        where,
        skip,
        take: limite,
        orderBy: { criadoEm: "desc" },
        select: {
          id: true,
          titulo: true,
          descricao: true,
          tipoArquivo: true,
          tamanhoBytes: true,
          downloads: true,
          criadoEm: true,
          curso:      { select: { id: true, nome: true } },
          disciplina: { select: { id: true, nome: true } },
          tema:       { select: { id: true, nome: true } },
          docente:    { select: { id: true, nome: true } },
        },
      }),
    ]);

    const totalPaginas = Math.ceil(total / limite);

    res.status(200).json({
      sucesso: true,
      mensagem: "Materiais listados com sucesso.",
      dados: {
        materiais,
        paginacao: { total, pagina, limite, totalPaginas },
      },
    });
  } catch (err) {
    console.error("[ALUNO] Erro ao listar materiais:", err);
    res.status(500).json({ sucesso: false, mensagem: "Erro interno no servidor.", dados: null });
  }
}

// =============================================================
//  GET /api/materiais/:id — detalhes do material
// =============================================================

export async function detalharMaterial(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const areaId = req.usuario!.areaConhecimentoId;

  try {
    const material = await prisma.material.findFirst({
      where: {
        id,
        deletadoEm: null,
        curso: { areaConhecimentoId: areaId ?? undefined },
      },
      include: {
        curso:      { include: { area: { select: { id: true, nome: true } } } },
        disciplina: { select: { id: true, nome: true } },
        tema:       { select: { id: true, nome: true } },
        docente:    { select: { id: true, nome: true } },
      },
    });

    if (!material) {
      res.status(404).json({ sucesso: false, mensagem: "Material não encontrado.", dados: null });
      return;
    }

    res.status(200).json({ sucesso: true, mensagem: "Material encontrado.", dados: material });
  } catch (err) {
    console.error("[ALUNO] Erro ao detalhar material:", err);
    res.status(500).json({ sucesso: false, mensagem: "Erro interno no servidor.", dados: null });
  }
}

// =============================================================
//  GET /api/materiais/:id/download — stream do arquivo
// =============================================================

export async function downloadMaterial(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const areaId = req.usuario!.areaConhecimentoId;

  try {
    const material = await prisma.material.findFirst({
      where: {
        id,
        deletadoEm: null,
        curso: { areaConhecimentoId: areaId ?? undefined },
      },
    });

    if (!material) {
      res.status(404).json({ sucesso: false, mensagem: "Material não encontrado.", dados: null });
      return;
    }

    // Monta caminho absoluto do arquivo
    const nomeArquivo = path.basename(material.arquivoUrl);
    const caminhoArquivo = path.join(UPLOAD_DIR, nomeArquivo);

    if (!fs.existsSync(caminhoArquivo)) {
      res.status(404).json({ sucesso: false, mensagem: "Arquivo não encontrado no servidor.", dados: null });
      return;
    }

    // Incrementa contador de downloads (fire-and-forget)
    prisma.material
      .update({ where: { id }, data: { downloads: { increment: 1 } } })
      .catch((err: unknown) => console.error("[ALUNO] Erro ao incrementar download:", err));

    // Stream do arquivo
    const stat = fs.statSync(caminhoArquivo);
    res.setHeader("Content-Length", stat.size);
    res.setHeader("Content-Disposition", `attachment; filename="${nomeArquivo}"`);
    res.setHeader("Content-Type", "application/octet-stream");

    const stream = fs.createReadStream(caminhoArquivo);
    stream.pipe(res);

    stream.on("error", (err) => {
      console.error("[ALUNO] Erro no stream:", err);
      if (!res.headersSent) {
        res.status(500).json({ sucesso: false, mensagem: "Erro ao transmitir arquivo.", dados: null });
      }
    });
  } catch (err) {
    console.error("[ALUNO] Erro ao fazer download:", err);
    res.status(500).json({ sucesso: false, mensagem: "Erro interno no servidor.", dados: null });
  }
}
