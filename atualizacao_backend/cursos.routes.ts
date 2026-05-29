import { Router } from "express";
import { autenticar } from "../middlewares/auth.middleware";
import { isAdmin, isAutenticado } from "../middlewares/perfil.middleware";
import {
  listarCursos,
  criarCurso,
  atualizarCurso,
  deletarCurso,
} from "../controllers/cursos.controller";

const router = Router();

// GET é acessível para qualquer usuário autenticado (docente precisa ver cursos)
router.get("/", autenticar, isAutenticado(), listarCursos);

// Demais rotas exigem ADMIN
router.post("/",      autenticar, isAdmin(), criarCurso);
router.put("/:id",    autenticar, isAdmin(), atualizarCurso);
router.delete("/:id", autenticar, isAdmin(), deletarCurso);

export default router;
