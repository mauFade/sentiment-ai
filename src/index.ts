import express from "express";
import cors from "cors";
import natural from "natural";
import path from "path";

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const analyzer = new natural.SentimentAnalyzer(
  "Portuguese",
  natural.PorterStemmerPt,
  "negation"
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
