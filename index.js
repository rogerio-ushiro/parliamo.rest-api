// src/index.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { buildTree } = require("./githubService");

const app = express();
const PORT = process.env.PORT || 3000;

// Habilita CORS para o app mobile
app.use(cors());
app.use(express.json());

// Endpoint principal para retornar a árvore de dados
app.get("/api/data", async (req, res) => {
    try {
        console.log("[GET /api/data] Iniciando buildTree...");
        const result = await buildTree();
        res.json(result);
    } catch (error) {
        console.error("[GET /api/data] Erro:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint de health-check (opcional)
app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});

app.listen(PORT, () => {
    console.log(`Parliamo REST API rodando na porta ${PORT}`);
});