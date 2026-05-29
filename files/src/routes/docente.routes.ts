import { Router } from "express";
import { autenticar } from "../middlewares/auth.middleware";
import { isDocente } from "../middlewares/perfil.middleware";
import { upload } from "../lib/multer";
import {
  listarMeusCursos,
  vincularCurso,
  desvincularCurso,
  listarMeusMateriais,
  criarMaterial,
  editarMaterial,
  deletarMaterial,
} from "../controllers/docente.controller";

const router = Router();

// Todas as rotas exigem JWT + perfil DOCENTE
router.use(autenticar, isDocente());

// ── Vínculos com cursos ──────────────────────────────────────
router.get("/cursos",            listarMeusCursos);
router.post("/cursos",           vincularCurso);
router.delete("/cursos/:cursoId", desvincularCurso);

// ── Materiais ────────────────────────────────────────────────
router.get("/materiais/meus",    listarMeusMateriais);
router.post(
  "/materiais",
  upload.single("arquivo"),   // campo do form-data
  criarMaterial
);
router.put("/materiais/:id",     editarMaterial);
router.delete("/materiais/:id",  deletarMaterial);

export default router;
