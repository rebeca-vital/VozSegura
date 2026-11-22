const { DataTypes } = require("sequelize");
const sequelize = require("../database");

const Usuario = sequelize.define("Usuario", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },

    nome: {
        type: DataTypes.STRING,
        allowNull: false
    },

    matricula: {
        type: DataTypes.STRING,
        allowNull: true
    },

    login: {
        type: DataTypes.STRING,
        allowNull: true
    },

    senha: {
        type: DataTypes.STRING,
        allowNull: false
    },

    perfil: {
        type: DataTypes.ENUM("Aluno", "Gestao"),
        allowNull: false
    },

    instituicaoId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    ativo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
}, {
    tableName: "usuario",
    freezeTableName: true
});

module.exports = Usuario;