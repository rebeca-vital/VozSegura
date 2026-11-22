const Instituicao = require("./instituicao");
const Usuario = require("./usuario");
const Ocorrencia = require("./Ocorrencia");

Instituicao.hasMany(Usuario, {
    foreignKey: "instituicaoId"
});

Usuario.belongsTo(Instituicao, {
    foreignKey: "instituicaoId"
});

Instituicao.hasMany(Ocorrencia, {
    foreignKey: "instituicaoId"
});

Ocorrencia.belongsTo(Instituicao, {
    foreignKey: "instituicaoId"
});

Usuario.hasMany(Ocorrencia, {
    foreignKey: "usuarioId"
});

Ocorrencia.belongsTo(Usuario, {
    foreignKey: "usuarioId"
});

module.exports = {
    Instituicao,
    Usuario,
    Ocorrencia
};