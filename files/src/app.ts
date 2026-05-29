import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import authRoutes from "./routes/auth.routes";
import areasRoutes from "./routes/areas.routes";
import cursosRoutes from "./routes/cursos.routes";
import disciplinasRoutes from "./routes/disciplinas.routes";
import temasRoutes from "./routes/temas.routes";
import docenteRoutes from "./routes/docente.routes";
import materiaisRoutes from "./routes/materiais.routes";
import adminRoutes from "./routes/admin.routes";

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL ?? "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve arquivos de upload estaticamente
app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

// Autenticação
app.use("/auth", authRoutes);

// Admin — CRUD
app.use("/api/areas",       areasRoutes);
app.use("/api/cursos",      cursosRoutes);
app.use("/api/disciplinas", disciplinasRoutes);
app.use("/api/temas",       temasRoutes);

// Admin — stats
app.use('/api/admin', adminRoutes);

// Docente — cursos e materiais
app.use("/api/docente",     docenteRoutes);

// Aluno — visualização e download
app.use("/api/materiais",   materiaisRoutes);

// Health check
app.get("/health", (_req, res) => {
  res.json({ sucesso: true, mensagem: "ok", dados: { timestamp: new Date().toISOString() } });
});

// 404
app.use((_req, res) => {
  res.status(404).json({ sucesso: false, mensagem: "Rota não encontrada.", dados: null });
});

export default app;
