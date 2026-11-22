const { DataTypes } = require("sequelize");
const sequelize = require("../database");

const Ocorrencia = sequelize.define("Ocorrencia", {
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
    prioridade: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "Recebida"
    },
    usuarioId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    instituicaoId: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    tableName: "ocorrencia",
    freezeTableName: true
});

module.exports = Ocorrencia;