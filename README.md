# Sentiment AI

Analisador de Sentimentos em Português com Inteligência Artificial

## ✨ Descrição

Este projeto é uma aplicação web e API para análise de sentimentos de textos em português, utilizando técnicas de NLP (Processamento de Linguagem Natural) e a biblioteca `natural`. O sistema identifica se um texto é **positivo**, **negativo** ou **neutro**, apresentando também um índice de confiança e estatísticas das análises realizadas.

- Interface web moderna e responsiva para uso rápido.
- API RESTful para integração com outros sistemas.
- Suporte a análise em lote e histórico das análises.

## 🚀 Funcionalidades

- Análise de sentimento de textos em português.
- Retorno de sentimento (positivo, negativo, neutro) e confiança.
- Histórico das últimas análises realizadas.
- Estatísticas agregadas das análises.
- Análise em lote de até 10 textos por vez.
- Frontend intuitivo para uso manual.

## 🖥️ Demonstração

Acesse a interface web em [http://localhost:3000](http://localhost:3000) após rodar o projeto.

- Exemplo de uso:
  - Digite ou cole um texto no campo indicado.
  - Clique em "Analisar Sentimento".
  - Veja o resultado, confiança, palavras positivas/negativas detectadas e histórico.

### Visual do app

![Demonstração do app](public/screenshots/main.png)

## ⚙️ Instalação

1. **Clone o repositório:**

   ```bash
   git clone https://github.com/mauFade/sentiment-ai.git
   cd sentiment-ai
   ```

2. **Instale as dependências:**

   ```bash
   yarn install
   # ou
   npm install
   ```

## ▶️ Como rodar

Execute o servidor em modo desenvolvimento:

```bash
yarn dev
# ou
npm run dev
```

Acesse em [http://localhost:3000](http://localhost:3000)

## 📚 Uso da API

A API RESTful expõe as seguintes rotas principais:

### `POST /api/analyze`

Analisa o sentimento de um texto.

- **Body:** `{ "text": "Seu texto aqui" }`
- **Retorno:**
  ```json
  {
    "success": true,
    "data": {
      "sentiment": "positivo|negativo|neutro",
      "confidence": 87,
      "score": 0.42,
      ...
    },
    "id": "..."
  }
  ```

### `GET /api/history`

Retorna o histórico das últimas 50 análises.

### `POST /api/batch-analyze`

Analisa em lote até 10 textos.

- **Body:** `{ "texts": ["texto 1", "texto 2", ...] }`

### `GET /api/stats`

Retorna estatísticas agregadas das análises realizadas.

## 📝 Exemplo de requisição (análise simples)

```bash
curl -X POST http://localhost:3000/api/analyze \
  -H 'Content-Type: application/json' \
  -d '{"text": "Adorei este produto! Super recomendo."}'
```

## 📂 Estrutura do Projeto

- `src/index.ts` — Ponto de entrada do servidor Express.
- `src/routes.ts` — Lógica de análise, rotas da API e histórico.
- `public/frontend.html` — Interface web para uso manual.
