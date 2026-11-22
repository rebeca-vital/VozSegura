
const fs = require("fs");
const csv = require("csv-parser");
const Instituicao = require("./models/instituicao");

const arquivo = "./dados/Análise - Tabela da lista das escolas - Detalhado.csv";

function normalizar(valor) {
    return String(valor || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();
}

const escolas = [];

fs.createReadStream(arquivo)
    .pipe(csv())
    .on("data", (linha) => {
        const nome = linha["Escola"];
        const codigo = String(linha["Código INEP"] || "").trim();
        const municipio = normalizar(linha["Município"]);
        const dependencia = normalizar(linha["Dependência Administrativa"]);
        const etapas = normalizar(linha["Etapas e Modalidade de Ensino Oferecidas"]);

        if (
            codigo &&
            nome &&
            municipio === "maracanau" &&
            dependencia === "estadual" &&
            etapas.includes("ensino medio")
        ) {
            escolas.push({
                nome: nome.trim(),
                codigoInep: codigo,
                municipio: linha["Município"].trim(),
                uf: "CE",
                ativa: true
            });
        }
    })
    .on("end", async () => {
        try {
            console.log("Escolas encontradas:", escolas.length);

            for (const escola of escolas) {
                await Instituicao.upsert(escola);
            }

            console.log("Importação concluída:", escolas.length, "escolas.");
            process.exit(0);
        } catch (erro) {
            console.error("Erro ao importar:", erro);
            process.exit(1);
        }
    })
    .on("error", (erro) => {
        console.error("Erro ao ler CSV:", erro);
        process.exit(1);
    });
