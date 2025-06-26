import express from "express";
import cors from "cors";
import { routes } from "./routes";

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.use(
  (
    err: Error,
    _: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Erro não tratado:", err);
    res.status(500).json({
      error: "Erro interno do servidor",
    });
  }
);

app.use("/", routes);

// Inicia o servidor
app.listen(port, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${port}`);
  console.log(`📊 API disponível em http://localhost:${port}/api`);
  console.log(`🎯 Teste a análise em http://localhost:${port}`);
});
