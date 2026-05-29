import { Router } from "express";
import { autenticar } from "../middlewares/auth.middleware";
import { isAdmin } from "../middlewares/perfil.middleware";
import { getStats } from "../controllers/admin.controller";

const router = Router();

router.use(autenticar, isAdmin());

router.get("/stats", getStats);

export default router;
