import { Router } from "express";
import { autenticar } from "../middlewares/auth.middleware";
import { isAdmin, isAutenticado } from "../middlewares/perfil.middleware";
import {
  listarTemas,
  criarTema,
  atualizarTema,
  deletarTema,
} from "../controllers/temas.controller";

const router = Router();

// GET acessível para qualquer usuário autenticado
router.get("/",       autenticar, isAutenticado(), listarTemas);

// Demais rotas exigem ADMIN
router.post("/",      autenticar, isAdmin(), criarTema);
router.put("/:id",    autenticar, isAdmin(), atualizarTema);
router.delete("/:id", autenticar, isAdmin(), deletarTema);

export default router;
