import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { TipoUsuario } from "../types/enums";

// =============================================================
//  Payload do JWT
// =============================================================

export interface JwtPayload {
  sub: string;           // id do usuário
  nome: string;
  email: string;
  tipo: TipoUsuario;
  areaConhecimentoId: string | null;
  iat?: number;
  exp?: number;
}

// =============================================================
//  Middleware — autenticar (valida JWT e injeta req.usuario)
// =============================================================

export function autenticar(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      sucesso: false,
      mensagem: "Token de autenticação não fornecido.",
    });
    return;
  }

  const token = authHeader.split(" ")[1];
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    res.status(500).json({
      sucesso: false,
      mensagem: "Configuração de autenticação inválida no servidor.",
    });
    return;
  }

  try {
    const payload = jwt.verify(token, secret) as JwtPayload;

    req.usuario = {
      id: payload.sub,
      nome: payload.nome,
      email: payload.email,
      tipo: payload.tipo,
      areaConhecimentoId: payload.areaConhecimentoId,
    };

    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        sucesso: false,
        mensagem: "Token expirado. Faça login novamente.",
      });
      return;
    }

    res.status(401).json({
      sucesso: false,
      mensagem: "Token inválido.",
    });
  }
}
