
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { spawn } = require("child_process");
const path = require("path");
const crypto = require("crypto");

const app = express();

const Ocorrencia = require("./models/Ocorrencia");
const Usuario = require("./models/usuario");
const Instituicao = require("./models/instituicao");

require("./models/associacoes");

const { autenticar, permitirPerfil } = require("./middleware/autenticacao");

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// ABRIR TELA DE LOGIN
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "login.html"));
});

// LISTAR INSTITUIÇÕES
app.get("/instituicoes", async (req, res) => {
    try {
        const instituicoes = await Instituicao.findAll({
            where: { ativa: true },
            attributes: ["id", "nome", "codigoInep", "municipio", "uf"],
            order: [["nome", "ASC"]]
        });

        res.json(instituicoes);

    } catch (erro) {
        console.error("Erro ao listar instituições:", erro);

        res.status(500).json({
            mensagem: "Erro ao carregar instituições."
        });
    }
});

// LOGIN DE ALUNO E GESTÃO
app.post("/login", async (req, res) => {
    try {
        const { instituicaoId, perfil, senha } = req.body;

        if (!instituicaoId || !perfil || !senha) {
            return res.status(400).json({
                mensagem: "Preencha todos os campos."
            });
        }

        if (!["Aluno", "Gestao"].includes(perfil)) {
            return res.status(400).json({
                mensagem: "Perfil inválido."
            });
        }

        const campoAcesso = perfil === "Aluno" ? "matricula" : "login";
        const identificador = req.body[campoAcesso];

        if (!identificador) {
            return res.status(400).json({
                mensagem: perfil === "Aluno"
                    ? "Informe sua matrícula."
                    : "Informe seu login."
            });
        }

        const usuario = await Usuario.findOne({
            where: {
                instituicaoId,
                perfil,
                [campoAcesso]: identificador,
                ativo: true
            }
        });

        if (!usuario) {
            return res.status(401).json({
                mensagem: "Usuário não encontrado ou acesso inválido."
            });
        }

        const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

        if (!senhaCorreta) {
            return res.status(401).json({
                mensagem: "Senha incorreta."
            });
        }

        const token = jwt.sign(
            {
                id: usuario.id,
                nome: usuario.nome,
                perfil: usuario.perfil,
                instituicaoId: usuario.instituicaoId
            },
            process.env.JWT_SECRET,
            { expiresIn: "8h" }
        );

        return res.json({
            mensagem: "Login realizado com sucesso.",
            token,
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                perfil: usuario.perfil,
                instituicaoId: usuario.instituicaoId
            }
        });

    } catch (erro) {
        console.error("Erro no login:", erro);

        res.status(500).json({
            mensagem: "Erro ao realizar login."
        });
    }
});

// REGISTRAR OCORRÊNCIA COM MACHINE LEARNING
app.post(
    "/ocorrencias",
    autenticar,
    permitirPerfil("Aluno"),
    async (req, res) => {
        const descricao = req.body?.descricao;

        if (typeof descricao !== "string" || !descricao.trim()) {
            return res.status(400).json({
                mensagem: "Informe a descrição da denúncia."
            });
        }

        const python = spawn("python", [
            path.join(__dirname, "machine-learning", "prever.py"),
            descricao.trim()
        ], {
            env: {
                ...process.env,
                PYTHONIOENCODING: "utf-8"
            }
        });

        let saidaPython = "";
        let erroPython = "";

        python.stdout.setEncoding("utf8");
        python.stderr.setEncoding("utf8");

        python.stdout.on("data", dados => {
            saidaPython += dados;
        });

        python.stderr.on("data", dados => {
            erroPython += dados;
        });

        python.on("error", erro => {
            console.error("Falha ao iniciar Python:", erro);

            if (!res.headersSent) {
                res.status(500).json({
                    mensagem: "Não foi possível iniciar o processamento."
                });
            }
        });

        python.on("close", async codigo => {
            if (res.headersSent) return;

            if (codigo !== 0) {
                console.error("Erro do Python:", erroPython);

                return res.status(500).json({
                    mensagem: "Erro ao processar a denúncia."
                });
            }

            try {
                const resultado = JSON.parse(saidaPython.trim());

                if (resultado.fora_escopo === true) {
                    return res.status(422).json({
                        fora_escopo: true,
                        mensagem: resultado.mensagem ||
                            "Revise ou complemente a descrição."
                    });
                }

                const prioridade = resultado.prioridade;

                if (!["Alta", "Média", "Baixa"].includes(prioridade)) {
                    return res.status(500).json({
                        mensagem: "Não foi possível classificar a denúncia."
                    });
                }

                const protocolo =
                    "VS-" +
                    Date.now() +
                    "-" +
                    crypto.randomBytes(2).toString("hex").toUpperCase();

                const novaOcorrencia = await Ocorrencia.create({
                    protocolo,
                    descricao: descricao.trim(),
                    prioridade,
                    status: "Recebida",
                    usuarioId: req.usuario.id,
                    instituicaoId: req.usuario.instituicaoId
                });

                return res.status(201).json({
                    mensagem: "Denúncia registrada com sucesso.",
                    ocorrencia: novaOcorrencia
                });

            } catch (erro) {
                console.error("Erro ao registrar ocorrência:", erro);

                return res.status(500).json({
                    mensagem: "Erro ao registrar a denúncia."
                });
            }
        });
    }
);

// GESTÃO: CONSULTAR A INSTITUIÇÃO AUTENTICADA
app.get(
    "/gestao/instituicao",
    autenticar,
    permitirPerfil("Gestao"),
    async (req, res) => {
        try {
            const instituicao = await Instituicao.findByPk(
                req.usuario.instituicaoId,
                {
                    attributes: ["id", "nome", "municipio", "uf"]
                }
            );

            if (!instituicao) {
                return res.status(404).json({
                    mensagem: "Instituição não encontrada."
                });
            }

            res.json(instituicao);

        } catch (erro) {
            console.error("Erro ao consultar instituição:", erro);

            res.status(500).json({
                mensagem: "Erro ao carregar os dados da instituição."
            });
        }
    }
);

// GESTÃO: LISTAR OCORRÊNCIAS DA SUA INSTITUIÇÃO
// INCLUI NOME E MATRÍCULA DO ALUNO
app.get(
    "/ocorrencias",
    autenticar,
    permitirPerfil("Gestao"),
    async (req, res) => {
        try {
            const ocorrencias = await Ocorrencia.findAll({
                where: {
                    instituicaoId: req.usuario.instituicaoId
                },

                include: [
                    {
                        model: Usuario,
                        attributes: ["id", "nome", "matricula"],
                        required: false
                    }
                ],

                order: [["id", "DESC"]]
            });

            res.json(ocorrencias);

        } catch (erro) {
            console.error("Erro ao consultar ocorrências:", erro);

            res.status(500).json({
                mensagem: "Erro ao consultar ocorrências."
            });
        }
    }
);

// GESTÃO: ATUALIZAR STATUS DA OCORRÊNCIA
app.patch(
    "/ocorrencias/:id/status",
    autenticar,
    permitirPerfil("Gestao"),
    async (req, res) => {
        try {
            const { status } = req.body;
            const id = Number(req.params.id);

            const statusPermitidos = [
                "Recebida",
                "Em análise",
                "Resolvida"
            ];

            if (!Number.isInteger(id) || id <= 0) {
                return res.status(400).json({
                    mensagem: "Identificador de ocorrência inválido."
                });
            }

            if (!statusPermitidos.includes(status)) {
                return res.status(400).json({
                    mensagem: "Status informado é inválido."
                });
            }

            const ocorrencia = await Ocorrencia.findOne({
                where: {
                    id,
                    instituicaoId: req.usuario.instituicaoId
                }
            });

            if (!ocorrencia) {
                return res.status(404).json({
                    mensagem: "Ocorrência não encontrada nesta instituição."
                });
            }

            ocorrencia.status = status;

            await ocorrencia.save();

            return res.json({
                mensagem: "Status atualizado com sucesso.",
                ocorrencia
            });

        } catch (erro) {
            console.error("Erro ao atualizar status:", erro);

            res.status(500).json({
                mensagem: "Erro ao atualizar o status da ocorrência."
            });
        }
    }
);

// CONSULTAR PROTOCOLO
app.get(
    "/ocorrencias/protocolo/:protocolo",
    autenticar,
    async (req, res) => {
        try {
            const ocorrencia = await Ocorrencia.findOne({
                where: {
                    protocolo: req.params.protocolo,
                    instituicaoId: req.usuario.instituicaoId
                }
            });

            if (!ocorrencia) {
                return res.status(404).json({
                    mensagem: "Ocorrência não encontrada."
                });
            }

            if (
                req.usuario.perfil === "Aluno" &&
                ocorrencia.usuarioId !== req.usuario.id
            ) {
                return res.status(403).json({
                    mensagem: "Você não tem acesso a esta ocorrência."
                });
            }

            res.json(ocorrencia);

        } catch (erro) {
            console.error("Erro ao consultar protocolo:", erro);

            res.status(500).json({
                mensagem: "Erro ao consultar protocolo."
            });
        }
    }
);

// INICIAR SERVIDOR
const PORTA = 3001;

app.listen(PORTA, () => {
    console.log(`Servidor VozSegura rodando na porta ${PORTA}.`);
});
