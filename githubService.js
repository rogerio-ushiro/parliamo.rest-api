// src/githubService.js
const fetch = require("cross-fetch");

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const BASE_URL =
    process.env.GITHUB_BASE_URL ||
    "https://api.github.com/repos/rogerio-ushiro/parliamo-data-api/contents/data";

if (!GITHUB_TOKEN) {
    console.warn(
        "[githubService] ATENÇÃO: GITHUB_TOKEN não definido. Configure no .env."
    );
}

// Timeout genérico
const fetchWithTimeout = (resource, options = {}) => {
    const { timeout = 15000, ...rest } = options;

    return Promise.race([
        fetch(resource, rest),
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Timeout da requisição")), timeout)
        ),
    ]);
};

const fetchGitHubFolder = async (url) => {
    console.log("[fetchGitHubFolder] Buscando do GitHub:", url);

    const response = await fetchWithTimeout(url, {
        headers: {
            Authorization: `Bearer ${GITHUB_TOKEN}`,
            Accept: "application/vnd.github.v3+json",
        },
        timeout: 15000,
    });

    console.log("[fetchGitHubFolder] Status da resposta:", response.status);
    const responseBody = await response.text();
    console.log("[fetchGitHubFolder] Corpo da resposta:", responseBody);

    if (!response.ok) {
        throw new Error(`Erro ao acessar ${url}: ${response.status}`);
    }

    return JSON.parse(responseBody);
};

const fetchJsonFile = async (url) => {
    console.log("[fetchJsonFile] Buscando JSON:", url);

    const response = await fetchWithTimeout(url, {
        headers: {
            Authorization: `Bearer ${GITHUB_TOKEN}`,
            Accept: "application/vnd.github.v3.raw",
        },
        timeout: 15000,
    });

    console.log("[fetchJsonFile] Status da resposta:", response.status);
    const responseBody = await response.text();
    console.log("[fetchJsonFile] Corpo da resposta:", responseBody);

    if (!response.ok) {
        throw new Error(`Erro ao carregar JSON ${url}: ${response.status}`);
    }

    return JSON.parse(responseBody);
};

// Versão Node do seu buildTree
const buildTree = async (url = BASE_URL) => {
    const items = await fetchGitHubFolder(url);

    const children = await Promise.all(
        items.map(async (item) => {
            if (item.type === "dir") {
                const nested = await buildTree(item.url);
                return {
                    title: item.name,
                    data: nested,
                };
            } else if (item.type === "file" && item.name.endsWith(".json")) {
                try {
                    const fileJson = await fetchJsonFile(item.url);
                    return {
                        title: item.name.replace(".json", ""),
                        ...fileJson,
                    };
                } catch (err) {
                    console.error(
                        "Erro ao processar JSON:",
                        item.path,
                        err.message
                    );
                    return null;
                }
            } else {
                return null;
            }
        })
    );

    return children.filter((c) => c !== null);
};

module.exports = {
    buildTree,
};