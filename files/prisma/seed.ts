// =============================================================
//  GBEducation — seed.ts COMPLETO
// =============================================================

import { PrismaClient } from "@prisma/client";
import { TipoUsuario } from "../src/types/enums";
import bcrypt from "bcryptjs";
import path from "path";
import fs from "fs";

const prisma = new PrismaClient();

function criarArquivoExemplo(nomeArquivo: string): string {
  const uploadsDir = path.resolve(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  const filePath = path.join(uploadsDir, nomeArquivo);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, `%PDF-1.4\nMaterial de exemplo: ${nomeArquivo}\nGBEducation`);
  }
  return `/uploads/${nomeArquivo}`;
}

async function main() {
  console.log("🌱 Iniciando seed completo do GBEducation...\n");

  const senhaAdminHash   = await bcrypt.hash("Admin@123",   12);
  const senhaDocenteHash = await bcrypt.hash("Docente@123", 12);
  const senhaAlunoHash   = await bcrypt.hash("Aluno@1234",  12);

  // 1. ADMIN
  const admin = await prisma.usuario.upsert({
    where: { email: "admin@gbeducation.com" },
    update: {},
    create: { nome: "Administrador", email: "admin@gbeducation.com", senhaHash: senhaAdminHash, tipo: TipoUsuario.ADMIN },
  });
  console.log(`✅ Admin: ${admin.email}`);

  // 2. AREAS
  const areaTI = await prisma.areaConhecimento.upsert({
    where: { nome: "Tecnologia da Informação" }, update: {},
    create: { nome: "Tecnologia da Informação", descricao: "Desenvolvimento de sistemas, redes e infraestrutura digital." },
  });
  const areaSaude = await prisma.areaConhecimento.upsert({
    where: { nome: "Ciências da Saúde" }, update: {},
    create: { nome: "Ciências da Saúde", descricao: "Saúde humana, medicina e ciências biomédicas." },
  });
  const areaHumanas = await prisma.areaConhecimento.upsert({
    where: { nome: "Ciências Humanas" }, update: {},
    create: { nome: "Ciências Humanas", descricao: "História, filosofia, sociologia e ciências sociais." },
  });
  console.log(`✅ Áreas: TI, Saúde, Humanas`);

  // 3. DOCENTES
  const docenteTI = await prisma.usuario.upsert({
    where: { email: "docente.ti@gbeducation.com" }, update: {},
    create: { nome: "Prof. Carlos Silva", email: "docente.ti@gbeducation.com", senhaHash: senhaDocenteHash, tipo: TipoUsuario.DOCENTE },
  });
  const docenteSaude = await prisma.usuario.upsert({
    where: { email: "docente.saude@gbeducation.com" }, update: {},
    create: { nome: "Profa. Ana Ferreira", email: "docente.saude@gbeducation.com", senhaHash: senhaDocenteHash, tipo: TipoUsuario.DOCENTE },
  });
  const docenteHumanas = await prisma.usuario.upsert({
    where: { email: "docente.humanas@gbeducation.com" }, update: {},
    create: { nome: "Prof. Roberto Mendes", email: "docente.humanas@gbeducation.com", senhaHash: senhaDocenteHash, tipo: TipoUsuario.DOCENTE },
  });
  console.log(`✅ Docentes: ${docenteTI.nome}, ${docenteSaude.nome}, ${docenteHumanas.nome}`);

  // 4. ALUNOS
  const alunoTI = await prisma.usuario.upsert({
    where: { email: "aluno.ti@gbeducation.com" }, update: {},
    create: { nome: "João Almeida", email: "aluno.ti@gbeducation.com", senhaHash: senhaAlunoHash, tipo: TipoUsuario.ALUNO, areaConhecimentoId: areaTI.id },
  });
  const alunoSaude = await prisma.usuario.upsert({
    where: { email: "aluno.saude@gbeducation.com" }, update: {},
    create: { nome: "Maria Costa", email: "aluno.saude@gbeducation.com", senhaHash: senhaAlunoHash, tipo: TipoUsuario.ALUNO, areaConhecimentoId: areaSaude.id },
  });
  const alunoHumanas = await prisma.usuario.upsert({
    where: { email: "aluno.humanas@gbeducation.com" }, update: {},
    create: { nome: "Pedro Santos", email: "aluno.humanas@gbeducation.com", senhaHash: senhaAlunoHash, tipo: TipoUsuario.ALUNO, areaConhecimentoId: areaHumanas.id },
  });
  console.log(`✅ Alunos: ${alunoTI.nome}, ${alunoSaude.nome}, ${alunoHumanas.nome}`);

  // 5. CURSOS
  const cursoDevWeb    = await prisma.curso.create({ data: { nome: "Desenvolvimento Web",    descricao: "Formação em desenvolvimento web moderno.",   areaConhecimentoId: areaTI.id      } });
  const cursoRedes     = await prisma.curso.create({ data: { nome: "Redes de Computadores",  descricao: "Fundamentos de redes e protocolos.",          areaConhecimentoId: areaTI.id      } });
  const cursoEnferm    = await prisma.curso.create({ data: { nome: "Enfermagem Básica",       descricao: "Princípios de enfermagem e cuidados.",        areaConhecimentoId: areaSaude.id   } });
  const cursoNutri     = await prisma.curso.create({ data: { nome: "Nutrição e Dietética",    descricao: "Bases da nutrição humana.",                   areaConhecimentoId: areaSaude.id   } });
  const cursoHistoria  = await prisma.curso.create({ data: { nome: "História Contemporânea", descricao: "Eventos do século XX e XXI.",                 areaConhecimentoId: areaHumanas.id } });
  const cursoFilosofia = await prisma.curso.create({ data: { nome: "Filosofia e Ética",       descricao: "Introdução ao pensamento filosófico.",        areaConhecimentoId: areaHumanas.id } });
  console.log(`✅ Cursos: 6 criados`);

  // 6. DISCIPLINAS
  const discReact   = await prisma.disciplina.create({ data: { nome: "React e Ecossistema",         descricao: "React, Hooks e Context API.",          cursoId: cursoDevWeb.id    } });
  const discRedes   = await prisma.disciplina.create({ data: { nome: "Protocolos de Rede",          descricao: "TCP/IP, UDP, HTTP e OSI.",             cursoId: cursoRedes.id     } });
  const discAnat    = await prisma.disciplina.create({ data: { nome: "Anatomia e Fisiologia",        descricao: "Bases anatômicas do corpo humano.",    cursoId: cursoEnferm.id    } });
  const discBioquim = await prisma.disciplina.create({ data: { nome: "Bioquímica dos Alimentos",     descricao: "Composição química e metabolismo.",    cursoId: cursoNutri.id     } });
  const discGuerra  = await prisma.disciplina.create({ data: { nome: "Guerra Fria e Bipolaridade",   descricao: "EUA vs URSS — conflito ideológico.",   cursoId: cursoHistoria.id  } });
  const discEtica   = await prisma.disciplina.create({ data: { nome: "Ética Aplicada",               descricao: "Dilemas éticos contemporâneos.",       cursoId: cursoFilosofia.id } });
  console.log(`✅ Disciplinas: 6 criadas`);

  // 7. TEMAS
  const temaZustand   = await prisma.tema.create({ data: { nome: "Gerenciamento de Estado com Zustand", descricao: "Estado global com Zustand.",          disciplinaId: discReact.id   } });
  const temaOSI       = await prisma.tema.create({ data: { nome: "Modelo OSI e TCP/IP",                 descricao: "Modelos de referência de redes.",      disciplinaId: discRedes.id   } });
  const temaCardio    = await prisma.tema.create({ data: { nome: "Sistema Cardiovascular",              descricao: "Coração e sistema circulatório.",       disciplinaId: discAnat.id    } });
  const temaCarboi    = await prisma.tema.create({ data: { nome: "Carboidratos e Glicemia",             descricao: "Metabolismo dos carboidratos.",         disciplinaId: discBioquim.id } });
  const temaEspacial  = await prisma.tema.create({ data: { nome: "Corrida Espacial",                    descricao: "Disputa tecnológica EUA vs URSS.",      disciplinaId: discGuerra.id  } });
  const temaRedes     = await prisma.tema.create({ data: { nome: "Ética nas Redes Sociais",             descricao: "Desafios éticos da comunicação digital.",disciplinaId: discEtica.id   } });
  console.log(`✅ Temas: 6 criados`);

  // 8. VINCULOS DOCENTE <-> CURSO
  await prisma.docenteCurso.createMany({
    skipDuplicates: true,
    data: [
      { docenteId: docenteTI.id,      cursoId: cursoDevWeb.id    },
      { docenteId: docenteTI.id,      cursoId: cursoRedes.id     },
      { docenteId: docenteSaude.id,   cursoId: cursoEnferm.id    },
      { docenteId: docenteSaude.id,   cursoId: cursoNutri.id     },
      { docenteId: docenteHumanas.id, cursoId: cursoHistoria.id  },
      { docenteId: docenteHumanas.id, cursoId: cursoFilosofia.id },
    ],
  });
  console.log(`✅ Vínculos: docentes vinculados aos cursos`);

  // 9. MATERIAIS
  const materiais = [
    { titulo: "Introdução ao React — Fundamentos",    descricao: "Material introdutório sobre React, componentes, props e state.",          arquivo: "introducao-react.pdf",   docenteId: docenteTI.id,      cursoId: cursoDevWeb.id,   disciplinaId: discReact.id,   temaId: temaZustand.id,  downloads: 42 },
    { titulo: "Hooks Avançados no React",              descricao: "Aprofundamento em useEffect, useCallback, useMemo e hooks customizados.", arquivo: "hooks-avancados.pdf",    docenteId: docenteTI.id,      cursoId: cursoDevWeb.id,   disciplinaId: discReact.id,                    downloads: 28 },
    { titulo: "Modelo OSI — Camadas e Protocolos",     descricao: "Explicação das 7 camadas do modelo OSI com exemplos práticos.",          arquivo: "modelo-osi.pdf",         docenteId: docenteTI.id,      cursoId: cursoRedes.id,    disciplinaId: discRedes.id,   temaId: temaOSI.id,      downloads: 15 },
    { titulo: "Anatomia Humana — Sistemas Básicos",    descricao: "Resumo dos principais sistemas do corpo humano.",                        arquivo: "anatomia-basica.pdf",    docenteId: docenteSaude.id,   cursoId: cursoEnferm.id,   disciplinaId: discAnat.id,    temaId: temaCardio.id,   downloads: 67 },
    { titulo: "Bioquímica dos Macronutrientes",        descricao: "Estudo de carboidratos, proteínas e lipídios e seus papéis metabólicos.",arquivo: "bioquimica-intro.pdf",   docenteId: docenteSaude.id,   cursoId: cursoNutri.id,    disciplinaId: discBioquim.id, temaId: temaCarboi.id,   downloads: 33 },
    { titulo: "A Guerra Fria — Cronologia e Análise",  descricao: "Linha do tempo dos principais eventos da Guerra Fria (1947-1991).",     arquivo: "guerra-fria.pdf",        docenteId: docenteHumanas.id, cursoId: cursoHistoria.id, disciplinaId: discGuerra.id,  temaId: temaEspacial.id, downloads: 19 },
    { titulo: "Ética Digital — Desafios Contemporâneos", descricao: "Dilemas éticos na era digital: privacidade e desinformação.",         arquivo: "etica-digital.pdf",      docenteId: docenteHumanas.id, cursoId: cursoFilosofia.id,disciplinaId: discEtica.id,   temaId: temaRedes.id,   downloads: 24 },
  ];

  for (const m of materiais) {
    await prisma.material.create({
      data: {
        titulo:       m.titulo,
        descricao:    m.descricao,
        arquivoUrl:   criarArquivoExemplo(m.arquivo),
        tipoArquivo:  "PDF",
        tamanhoBytes: Math.floor(Math.random() * 500000) + 100000,
        downloads:    m.downloads,
        docenteId:    m.docenteId,
        cursoId:      m.cursoId,
        disciplinaId: m.disciplinaId ?? null,
        temaId:       m.temaId ?? null,
      },
    });
  }
  console.log(`✅ Materiais: ${materiais.length} materiais criados`);

  // RESUMO
  console.log("\n🎉 Seed completo!");
  console.log("═══════════════════════════════════════════════");
  console.log("  ADMIN");
  console.log("  ├─ admin@gbeducation.com        / Admin@123");
  console.log("");
  console.log("  DOCENTES  (senha: Docente@123)");
  console.log("  ├─ docente.ti@gbeducation.com");
  console.log("  ├─ docente.saude@gbeducation.com");
  console.log("  └─ docente.humanas@gbeducation.com");
  console.log("");
  console.log("  ALUNOS  (senha: Aluno@1234)");
  console.log("  ├─ aluno.ti@gbeducation.com");
  console.log("  ├─ aluno.saude@gbeducation.com");
  console.log("  └─ aluno.humanas@gbeducation.com");
  console.log("");
  console.log("  DADOS: 3 áreas · 6 cursos · 6 disciplinas");
  console.log("         6 temas · 6 vínculos · 7 materiais");
  console.log("═══════════════════════════════════════════════\n");
}

main()
  .catch((e) => { console.error("❌ Erro:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
