
require("dotenv").config();

const bcrypt = require("bcryptjs");
const sequelize = require("./database");
const Usuario = require("./models/usuario");
const Instituicao = require("./models/instituicao");

const escolasDemo = [
    {
        codigoInep: "23079495",
        matricula: "2026001",
        login: "gestor.adahil",
        aluno: "Aluno Demonstração",
        gestor: "Gestor Demonstração"
    },
    {
        codigoInep: "23079649",
        matricula: "2026002",
        login: "gestor.antonio",
        aluno: "Aluno Demonstração",
        gestor: "Gestor Demonstração"
    },
    {
        codigoInep: "23080710",
        matricula: "2026003",
        login: "gestor.josemilton",
        aluno: "Aluno Demonstração",
        gestor: "Gestor Demonstração"
    }
];

async function criarOuAtualizarUsuario({
    instituicaoId,
    nome,
    matricula,
    login,
    perfil,
    senha
}) {
    const senhaHash = await bcrypt.hash(senha, 10);

    const identificador = perfil === "Aluno"
        ? { matricula }
        : { login };

    const [usuario, criado] = await Usuario.findOrCreate({
        where: {
            instituicaoId,
            perfil,
            ...identificador
        },
        defaults: {
            nome,
            matricula: matricula || null,
            login: login || null,
            senha: senhaHash,
            perfil,
            instituicaoId,
            ativo: true
        }
    });

    if (!criado) {
        await usuario.update({
            nome,
            senha: senhaHash,
            ativo: true
        });
    }

    console.log(
        `${perfil} ${criado ? "criado" : "atualizado"}: ${nome}`
    );
}

async function criarUsuarios() {
    try {
        await sequelize.authenticate();

        for (const escola of escolasDemo) {
            const instituicao = await Instituicao.findOne({
                where: {
                    codigoInep: escola.codigoInep
                }
            });

            if (!instituicao) {
                console.log(
                    "Instituição não encontrada:",
                    escola.codigoInep
                );
                continue;
            }

            await criarOuAtualizarUsuario({
                instituicaoId: instituicao.id,
                nome: escola.aluno,
                matricula: escola.matricula,
                perfil: "Aluno",
                senha: "Aluno123!"
            });

            await criarOuAtualizarUsuario({
                instituicaoId: instituicao.id,
                nome: escola.gestor,
                login: escola.login,
                perfil: "Gestao",
                senha: "Gestao123!"
            });

            console.log("Escola processada:", instituicao.nome);
        }

        console.log("Contas de demonstração atualizadas com sucesso!");

    } catch (erro) {
        console.error("Erro ao criar usuários:", erro);
    } finally {
        await sequelize.close();
    }
}

criarUsuarios();
