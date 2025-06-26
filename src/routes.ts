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
  "English",
  natural.PorterStemmerPt,
  "negations"
);

const tokenizer = new natural.WordTokenizer();

const translationMap: { [key: string]: string } = {
  bom: "good",
  ótimo: "great",
  excelente: "excellent",
  fantástico: "fantastic",
  maravilhoso: "wonderful",
  perfeito: "perfect",
  incrível: "incredible",
  adorei: "loved",
  amei: "loved",
  feliz: "happy",
  alegre: "cheerful",
  satisfeito: "satisfied",
  recomendo: "recommend",
  aprovado: "approved",
  sucesso: "success",
  top: "top",
  show: "awesome",
  legal: "cool",
  gostei: "liked",
  curtir: "enjoy",
  parabéns: "congratulations",
  bonito: "beautiful",
  lindo: "beautiful",
  melhor: "better",
  qualidade: "quality",
  rápido: "fast",
  eficiente: "efficient",
  útil: "useful",
  obrigado: "thanks",
  ruim: "bad",
  péssimo: "terrible",
  horrível: "horrible",
  terrível: "awful",
  odeio: "hate",
  detesto: "hate",
  triste: "sad",
  chateado: "upset",
  decepcionado: "disappointed",
  frustrado: "frustrated",
  irritado: "angry",
  problema: "problem",
  erro: "error",
  falha: "failure",
  defeito: "defect",
  lixo: "garbage",
  pior: "worse",
  difícil: "difficult",
  complicado: "complicated",
  caro: "expensive",
  demorado: "slow",
  chato: "boring",
  feio: "ugly",
  produto: "product",
  serviço: "service",
  compra: "purchase",
  entrega: "delivery",
  atendimento: "service",
  preço: "price",
  valor: "value",
  tempo: "time",
  empresa: "company",
  não: "not",
  nunca: "never",
  nada: "nothing",
  nem: "neither",
  jamais: "never",
  nenhum: "none",
  nenhuma: "none",
};

const positiveWordsPortuguese = [
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

const negativeWordsPortuguese = [
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

function translateToEnglish(text: string): string {
  const words = text.toLowerCase().split(/\s+/);

  const translatedWords = words.map((word) => {
    // Remove pontuação para buscar a palavra
    const cleanWord = word.replace(/[^\w]/g, "");
    return translationMap[cleanWord] || word;
  });

  return translatedWords.join(" ");
}

function analyzeSentiment(text: string) {
  const normalizedText = text
    .toLowerCase()
    .replace(/[^\w\s\u00C0-\u017F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const tokensPortuguese = tokenizer.tokenize(normalizedText) || [];

  const translatedText = translateToEnglish(normalizedText);
  const tokensEnglish = tokenizer.tokenize(translatedText) || [];

  let positiveCountPt = 0;
  let negativeCountPt = 0;

  tokensPortuguese.forEach((token) => {
    if (positiveWordsPortuguese.includes(token)) {
      positiveCountPt++;
    }
    if (negativeWordsPortuguese.includes(token)) {
      negativeCountPt++;
    }
  });

  let naturalScore = 0;
  if (tokensEnglish.length > 0) {
    try {
      const stems = tokensEnglish.map((token) =>
        natural.PorterStemmer.stem(token)
      );
      naturalScore = analyzer.getSentiment(stems);
    } catch (error) {
      console.warn("Erro na análise Natural:", error);
    }
  }

  const localScore =
    tokensPortuguese.length > 0
      ? (positiveCountPt - negativeCountPt) / tokensPortuguese.length
      : 0;

  const combinedScore = localScore * 0.6 + naturalScore * 0.4;

  let sentiment: string;
  let confidence: number;

  if (combinedScore > 0.15) {
    sentiment = "positivo";
    confidence = Math.min(Math.abs(combinedScore) * 3, 1);
  } else if (combinedScore < -0.15) {
    sentiment = "negativo";
    confidence = Math.min(Math.abs(combinedScore) * 3, 1);
  } else {
    sentiment = "neutro";
    confidence = 0.4 + Math.abs(combinedScore) * 0.6;
  }

  return {
    sentiment,
    confidence: Math.round(confidence * 100),
    score: Math.round(combinedScore * 100) / 100,
    wordCount: tokensPortuguese.length,
    positiveWords: positiveCountPt,
    negativeWords: negativeCountPt,
    analysis: {
      originalText: normalizedText,
      translatedText: translatedText,
      tokensPortuguese: tokensPortuguese.slice(0, 10),
      tokensEnglish: tokensEnglish.slice(0, 10),
      localScore: Math.round(localScore * 100) / 100,
      naturalScore: Math.round(naturalScore * 100) / 100,
      detectedPositive: tokensPortuguese.filter((t) =>
        positiveWordsPortuguese.includes(t)
      ),
      detectedNegative: tokensPortuguese.filter((t) =>
        negativeWordsPortuguese.includes(t)
      ),
    },
  };
}

let analysisHistory: AnalysisHistory[] = [];

// Rotas da API
routes.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/frontend.html"));
});

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

    res.json({
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
