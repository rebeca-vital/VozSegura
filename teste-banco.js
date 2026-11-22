const sequelize = require("./database");
const Ocorrencia = require("./models/Ocorrencia");
const Solicitacao = require("./models/Solicitacao");

async function testar() {
    try {
        await sequelize.authenticate();
        console.log("Banco conectado com sucesso!");

        await sequelize.sync();

        console.log("Tabela Ocorrencia criada com sucesso!");
    } catch (erro) {
        console.error("Erro:", erro);
    }
}

testar();