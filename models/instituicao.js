
const { DataTypes } = require("sequelize");
const sequelize = require("../database");

const Instituicao = sequelize.define("Instituicao", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },

    nome: {
        type: DataTypes.STRING,
        allowNull: false
    },

    codigoInep: {
        type: DataTypes.STRING(8),
        allowNull: false,
        unique: true
    },

    municipio: {
        type: DataTypes.STRING,
        allowNull: false
    },

    uf: {
        type: DataTypes.STRING(2),
        allowNull: false,
        defaultValue: "CE"
    },

    ativa: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
}, {
    tableName: "instituicao",
    freezeTableName: true
});

module.exports = Instituicao;
