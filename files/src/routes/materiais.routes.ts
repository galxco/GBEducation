import { Router } from "express";
import { autenticar } from "../middlewares/auth.middleware";
import { isAluno } from "../middlewares/perfil.middleware";
import {
  listarMateriais,
  detalharMaterial,
  downloadMaterial,
} from "../controllers/aluno.controller";

const router = Router();

// Todas as rotas exigem JWT + perfil ALUNO
router.use(autenticar, isAluno());

router.get("/",              listarMateriais);   // GET /api/materiais
router.get("/:id",           detalharMaterial);  // GET /api/materiais/:id
router.get("/:id/download",  downloadMaterial);  // GET /api/materiais/:id/download

export default router;
