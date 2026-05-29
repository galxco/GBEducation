import { Router } from "express";
import { autenticar } from "../middlewares/auth.middleware";
import { isAdmin } from "../middlewares/perfil.middleware";
import {
  listarAreas,
  criarArea,
  atualizarArea,
  deletarArea,
} from "../controllers/areas.controller";

const router = Router();

// GET é público — necessário para o cadastro de alunos
router.get("/", listarAreas);

// Demais rotas exigem autenticação + perfil ADMIN
router.post("/",    autenticar, isAdmin(), criarArea);
router.put("/:id",  autenticar, isAdmin(), atualizarArea);
router.delete("/:id", autenticar, isAdmin(), deletarArea);

export default router;
