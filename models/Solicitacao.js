
const { DataTypes } = require("sequelize");
const sequelize = require("../database");

const Solicitacao = sequelize.define("Solicitacao", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },

    protocolo: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },

    descricao: {
        type: DataTypes.TEXT,
        allowNull: false
    },

    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "Recebida"
    }
}, {
    tableName: "Solicitacao",
    freezeTableName: true
});

module.exports = Solicitacao;
