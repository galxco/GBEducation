import { Router } from "express";
import { autenticar } from "../middlewares/auth.middleware";
import { isAdmin, isAutenticado } from "../middlewares/perfil.middleware";
import {
  listarDisciplinas,
  criarDisciplina,
  atualizarDisciplina,
  deletarDisciplina,
} from "../controllers/disciplinas.controller";

const router = Router();

// GET acessível para qualquer usuário autenticado
router.get("/",       autenticar, isAutenticado(), listarDisciplinas);

// Demais rotas exigem ADMIN
router.post("/",      autenticar, isAdmin(), criarDisciplina);
router.put("/:id",    autenticar, isAdmin(), atualizarDisciplina);
router.delete("/:id", autenticar, isAdmin(), deletarDisciplina);

export default router;
