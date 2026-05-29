import { Request, Response, NextFunction } from "express";
import { TipoUsuario } from "../types/enums";

// =============================================================
//  Helper interno — factory de middleware por perfil
// =============================================================

function exigirPerfil(...perfisPermitidos: TipoUsuario[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // O middleware autenticar deve rodar antes deste
    if (!req.usuario) {
      res.status(401).json({
        sucesso: false,
        mensagem: "Não autenticado.",
      });
      return;
    }

    const { tipo } = req.usuario;

    if (!perfisPermitidos.includes(tipo)) {
      res.status(403).json({
        sucesso: false,
        mensagem: `Acesso restrito. Perfil necessário: ${perfisPermitidos.join(" ou ")}.`,
      });
      return;
    }

    next();
  };
}

// =============================================================
//  Middlewares exportados por perfil
// =============================================================

/** Permite apenas ADMIN */
export const isAdmin = () => exigirPerfil(TipoUsuario.ADMIN);

/** Permite apenas DOCENTE */
export const isDocente = () => exigirPerfil(TipoUsuario.DOCENTE);

/** Permite apenas ALUNO */
export const isAluno = () => exigirPerfil(TipoUsuario.ALUNO);

/** Permite ADMIN ou DOCENTE */
export const isAdminOuDocente = () =>
  exigirPerfil(TipoUsuario.ADMIN, TipoUsuario.DOCENTE);

/** Permite qualquer perfil autenticado */
export const isAutenticado = () =>
  exigirPerfil(TipoUsuario.ADMIN, TipoUsuario.DOCENTE, TipoUsuario.ALUNO);
