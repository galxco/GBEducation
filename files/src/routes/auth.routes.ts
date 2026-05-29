import { Router } from "express";
import rateLimit from "express-rate-limit";
import { cadastro, login, me } from "../controllers/auth.controller";
import { autenticar } from "../middlewares/auth.middleware";

const router = Router();

// =============================================================
//  Rate limit — 10 requisições por minuto por IP
// =============================================================

const limiteAutenticacao = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    sucesso: false,
    mensagem: "Muitas tentativas. Tente novamente em 1 minuto.",
  },
});

// =============================================================
//  Rotas públicas (com rate limit)
// =============================================================

// POST /auth/cadastro
router.post("/cadastro", limiteAutenticacao, cadastro);

// POST /auth/login
router.post("/login", limiteAutenticacao, login);

// =============================================================
//  Rotas protegidas (exige JWT válido)
// =============================================================

// GET /auth/me
router.get("/me", autenticar, me);

export default router;
