import "dotenv/config";
import app from "./app";

const PORT = process.env.PORT ?? 3333;

app.listen(PORT, () => {
  console.log(`\n🚀 GBEducation API rodando em http://localhost:${PORT}`);
  console.log(`   Ambiente : ${process.env.NODE_ENV ?? "development"}`);
  console.log(`   Health   : http://localhost:${PORT}/health\n`);
});
