import { Router } from "express";
import natural from "natural";
import path from "path";

const routes = Router();

interface AnalysisHistory {
  id: string;
  text: string;
  result: any;
  timestamp: Date;
}

const analyzer = new natural.SentimentAnalyzer(
  "Portuguese",
  natural.PorterStemmerPt,
  "afinn"
);

const tokenizer = new natural.WordTokenizer();

const positiveWords = [
  "bom",
  "ótimo",
  "excelente",
  "fantástico",
  "maravilhoso",
  "perfeito",
  "incrível",
  "adorei",
  "amei",
  "feliz",
  "alegre",
  "satisfeito",
  "recomendo",
  "aprovado",
  "sucesso",
  "top",
  "show",
  "legal",
];

const negativeWords = [
  "ruim",
  "péssimo",
  "horrível",
  "terrível",
  "odeio",
  "detesto",
  "triste",
  "chateado",
  "decepcionado",
  "frustrado",
  "irritado",
  "problema",
  "erro",
  "falha",
  "defeito",
  "lixo",
  "pior",
];

function analyzeSentiment(text: string) {
  const normalizedText = text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const tokens = tokenizer.tokenize(normalizedText) || [];

  let positiveCount = 0;
  let negativeCount = 0;
  let totalWords = tokens.length;

  tokens.forEach((token) => {
    if (positiveWords.includes(token)) {
      positiveCount++;
    }
    if (negativeWords.includes(token)) {
      negativeCount++;
    }
  });

  let score = 0;
  if (totalWords > 0) {
    score = (positiveCount - negativeCount) / totalWords;
  }

  let sentiment: string;
  let confidence: number;

  if (score > 0.1) {
    sentiment = "positivo";
    confidence = Math.min(score * 5, 1);
  } else if (score < -0.1) {
    sentiment = "negativo";
    confidence = Math.min(Math.abs(score) * 5, 1);
  } else {
    sentiment = "neutro";
    confidence = 0.5;
  }

  return {
    sentiment,
    confidence: Math.round(confidence * 100),
    score: Math.round(score * 100) / 100,
    wordCount: totalWords,
    positiveWords: positiveCount,
    negativeWords: negativeCount,
    analysis: {
      tokens: tokens.slice(0, 10),
      detectedPositive: tokens.filter((t) => positiveWords.includes(t)),
      detectedNegative: tokens.filter((t) => negativeWords.includes(t)),
    },
  };
}

let analysisHistory: AnalysisHistory[] = [];

// Rotas da API
routes.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/frontend.html"));
});

// Rota principal para análise de sentimento
routes.post("/api/analyze", (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== "string") {
      return res.status(400).json({
        error: "Texto é obrigatório e deve ser uma string",
      });
    }

    if (text.length > 1000) {
      return res.status(400).json({
        error: "Texto muito longo. Máximo 1000 caracteres.",
      });
    }

    const result = analyzeSentiment(text);

    // Salva no histórico
    const analysis: AnalysisHistory = {
      id: Date.now().toString(),
      text: text.substring(0, 100) + (text.length > 100 ? "..." : ""),
      result,
      timestamp: new Date(),
    };

    analysisHistory.unshift(analysis);

    // Mantém apenas os últimos 50 resultados
    analysisHistory = analysisHistory.slice(0, 50);

    res.json({
      success: true,
      data: result,
      id: analysis.id,
    });
  } catch (error) {
    console.error("Erro na análise:", error);
    res.status(500).json({
      error: "Erro interno do servidor",
    });
  }
});

// Rota para buscar histórico
routes.get("/api/history", (req, res) => {
  res.json({
    success: true,
    data: analysisHistory.map((item) => ({
      id: item.id,
      text: item.text,
      sentiment: item.result.sentiment,
      confidence: item.result.confidence,
      timestamp: item.timestamp,
    })),
  });
});

// Rota para análise em lote
routes.post("/api/batch-analyze", (req, res) => {
  try {
    const { texts } = req.body;

    if (!Array.isArray(texts)) {
      return res.status(400).json({
        error: "Texts deve ser um array",
      });
    }

    if (texts.length > 10) {
      return res.status(400).json({
        error: "Máximo 10 textos por vez",
      });
    }

    const results = texts.map((text, index) => {
      if (typeof text !== "string") {
        return {
          index,
          error: "Texto deve ser uma string",
        };
      }

      return {
        index,
        text: text.substring(0, 50) + "...",
        result: analyzeSentiment(text),
      };
    });

    res.send({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("Erro na análise em lote:", error);
    res.status(500).json({
      error: "Erro interno do servidor",
    });
  }
});

// Rota para estatísticas
routes.get("/api/stats", (req, res) => {
  const stats = {
    totalAnalyses: analysisHistory.length,
    sentimentBreakdown: {
      positive: analysisHistory.filter((a) => a.result.sentiment === "positivo")
        .length,
      negative: analysisHistory.filter((a) => a.result.sentiment === "negativo")
        .length,
      neutral: analysisHistory.filter((a) => a.result.sentiment === "neutro")
        .length,
    },
    averageConfidence:
      analysisHistory.length > 0
        ? Math.round(
            analysisHistory.reduce((acc, a) => acc + a.result.confidence, 0) /
              analysisHistory.length
          )
        : 0,
    lastAnalysis: analysisHistory[0]?.timestamp || null,
  };

  res.json({
    success: true,
    data: stats,
  });
});

export { routes };
