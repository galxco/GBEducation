import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { TipoUsuario } from "../types/enums";
import { prisma } from "../lib/prisma";
import { JwtPayload } from "../middlewares/auth.middleware";

// =============================================================
//  Schemas de validação (Zod)
// =============================================================

const schemaCadastro = z
  .object({
    nome: z
      .string({ required_error: "Nome é obrigatório." })
      .min(3, "Nome deve ter no mínimo 3 caracteres."),

    email: z
      .string({ required_error: "E-mail é obrigatório." })
      .email("E-mail inválido."),

    senha: z
      .string({ required_error: "Senha é obrigatória." })
      .min(8, "Senha deve ter no mínimo 8 caracteres.")
      .regex(/[A-Z]/, "Senha deve conter pelo menos 1 letra maiúscula.")
      .regex(/[0-9]/, "Senha deve conter pelo menos 1 número."),

    tipo: z.enum([TipoUsuario.ALUNO, TipoUsuario.DOCENTE], {
      required_error: "Tipo é obrigatório.",
      invalid_type_error: "Tipo deve ser ALUNO ou DOCENTE.",
    }),

    areaConhecimentoId: z.string().uuid("ID de área inválido.").optional(),
  })
  .refine(
    (data) => {
      // areaConhecimentoId é obrigatório para ALUNO
      if (data.tipo === TipoUsuario.ALUNO && !data.areaConhecimentoId) {
        return false;
      }
      return true;
    },
    {
      message: "Área de conhecimento é obrigatória para alunos.",
      path: ["areaConhecimentoId"],
    }
  );

const schemaLogin = z.object({
  email: z
    .string({ required_error: "E-mail é obrigatório." })
    .email("E-mail inválido."),

  senha: z.string({ required_error: "Senha é obrigatória." }),
});

// =============================================================
//  Helpers
// =============================================================

function gerarTokens(usuario: {
  id: string;
  nome: string;
  email: string;
  tipo: TipoUsuario;
  areaConhecimentoId: string | null;
}) {
  const secret = process.env.JWT_SECRET!;
  const refreshSecret = process.env.JWT_REFRESH_SECRET!;

  const payload: Omit<JwtPayload, "iat" | "exp"> = {
    sub: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    tipo: usuario.tipo,
    areaConhecimentoId: usuario.areaConhecimentoId,
  };

  const accessToken = jwt.sign(payload, secret, { expiresIn: "8h" });
  const refreshToken = jwt.sign({ sub: usuario.id }, refreshSecret, {
    expiresIn: "7d",
  });

  return { accessToken, refreshToken };
}

function redirecionamentoPorPerfil(tipo: TipoUsuario): string {
  const rotas: Record<TipoUsuario, string> = {
    ADMIN: "/admin/dashboard",
    DOCENTE: "/docente/dashboard",
    ALUNO: "/aluno/dashboard",
  };
  return rotas[tipo];
}

// =============================================================
//  POST /auth/cadastro
// =============================================================

export async function cadastro(req: Request, res: Response): Promise<void> {
  const resultado = schemaCadastro.safeParse(req.body);

  if (!resultado.success) {
    res.status(400).json({
      sucesso: false,
      mensagem: "Dados inválidos.",
      erros: resultado.error.flatten().fieldErrors,
    });
    return;
  }

  const { nome, email, senha, tipo, areaConhecimentoId } = resultado.data as {
    nome: string;
    email: string;
    senha: string;
    tipo: TipoUsuario;
    areaConhecimentoId?: string;
  };

  try {
    // Verifica e-mail duplicado
    const emailExistente = await prisma.usuario.findUnique({ where: { email } });
    if (emailExistente) {
      res.status(409).json({
        sucesso: false,
        mensagem: "E-mail já cadastrado.",
      });
      return;
    }

    // Verifica se a área existe (quando ALUNO)
    if (areaConhecimentoId) {
      const areaExiste = await prisma.areaConhecimento.findUnique({
        where: { id: areaConhecimentoId },
      });
      if (!areaExiste) {
        res.status(400).json({
          sucesso: false,
          mensagem: "Área de conhecimento não encontrada.",
        });
        return;
      }
    }

    const senhaHash = await bcrypt.hash(senha, 12);

    const novoUsuario = await prisma.usuario.create({
      data: {
        nome,
        email,
        senhaHash,
        tipo,
        areaConhecimentoId: areaConhecimentoId ?? null,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        tipo: true,
        areaConhecimentoId: true,
        criadoEm: true,
      },
    });

    const { accessToken, refreshToken } = gerarTokens(novoUsuario);

    res.status(201).json({
      sucesso: true,
      mensagem: "Cadastro realizado com sucesso.",
      dados: {
        usuario: novoUsuario,
        accessToken,
        refreshToken,
        redirecionarPara: redirecionamentoPorPerfil(novoUsuario.tipo),
      },
    });
  } catch (err) {
    console.error("[AUTH] Erro no cadastro:", err);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro interno no servidor.",
    });
  }
}

// =============================================================
//  POST /auth/login
// =============================================================

export async function login(req: Request, res: Response): Promise<void> {
  const resultado = schemaLogin.safeParse(req.body);

  if (!resultado.success) {
    res.status(400).json({
      sucesso: false,
      mensagem: "Dados inválidos.",
      erros: resultado.error.flatten().fieldErrors,
    });
    return;
  }

  const { email, senha } = resultado.data;

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { email },
      select: {
        id: true,
        nome: true,
        email: true,
        senhaHash: true,
        tipo: true,
        areaConhecimentoId: true,
      },
    });

    // Mensagem genérica intencional — evita enumeração de usuários
    const erroCredenciais = {
      sucesso: false,
      mensagem: "E-mail ou senha incorretos.",
    };

    if (!usuario) {
      res.status(401).json(erroCredenciais);
      return;
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senhaHash);
    if (!senhaValida) {
      res.status(401).json(erroCredenciais);
      return;
    }

    const { senhaHash: _, ...usuarioSemSenha } = usuario;
    const { accessToken, refreshToken } = gerarTokens(usuarioSemSenha);

    res.status(200).json({
      sucesso: true,
      mensagem: "Login realizado com sucesso.",
      dados: {
        usuario: usuarioSemSenha,
        accessToken,
        refreshToken,
        redirecionarPara: redirecionamentoPorPerfil(usuario.tipo),
      },
    });
  } catch (err) {
    console.error("[AUTH] Erro no login:", err);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro interno no servidor.",
    });
  }
}

// =============================================================
//  GET /auth/me
// =============================================================

export async function me(req: Request, res: Response): Promise<void> {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.usuario!.id },
      select: {
        id: true,
        nome: true,
        email: true,
        tipo: true,
        criadoEm: true,
        areaConhecimentoId: true,
        area: {
          select: { id: true, nome: true },
        },
      },
    });

    if (!usuario) {
      res.status(404).json({
        sucesso: false,
        mensagem: "Usuário não encontrado.",
      });
      return;
    }

    res.status(200).json({
      sucesso: true,
      dados: { usuario },
    });
  } catch (err) {
    console.error("[AUTH] Erro no /me:", err);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro interno no servidor.",
    });
  }
}
