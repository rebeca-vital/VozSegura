
const token = sessionStorage.getItem("token");
const usuario = JSON.parse(sessionStorage.getItem("usuario") || "null");

const form = document.getElementById("formOcorrencia");
const mensagem = document.getElementById("mensagem");
const botaoEnviar = form.querySelector('button[type="submit"]');

const formAcompanhamento = document.getElementById("formAcompanhamento");
const resultado = document.getElementById("resultadoAcompanhamento");

const telaDenuncia = document.querySelector(".formulario-container");
const telaAcompanhamento = document.getElementById("telaAcompanhamento");

const linkDenuncia = document.getElementById("linkDenuncia");
const linkAcompanhamento = document.getElementById("linkAcompanhamento");

// VERIFICAR AUTENTICAÇÃO
if (!token || !usuario || usuario.perfil !== "Aluno") {
    sessionStorage.clear();
    window.location.href = "login.html";
}

// CABEÇALHO COM TOKEN
function cabecalhoAutenticado() {
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };
}

// ENVIAR OCORRÊNCIA
form.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const descricao = document.getElementById("descricao").value.trim();

    mensagem.textContent = "";

    if (!descricao) {
        mensagem.textContent = "Descreva o que aconteceu antes de enviar.";
        return;
    }

    botaoEnviar.disabled = true;
    botaoEnviar.textContent = "ENVIANDO...";

    try {
        const resposta = await fetch("/ocorrencias", {
            method: "POST",
            headers: cabecalhoAutenticado(),
            body: JSON.stringify({ descricao })
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                dados.mensagem || "Não foi possível registrar a ocorrência."
            );
        }

        if (dados.fora_escopo === true) {
            mensagem.textContent = dados.mensagem;
            return;
        }

        const ocorrencia = dados.ocorrencia;

        if (!ocorrencia || !ocorrencia.protocolo) {
            throw new Error("Ocorrência registrada, mas o protocolo não foi retornado.");
        }

        mensagem.textContent = "";

        const confirmacao = document.createElement("strong");
        confirmacao.textContent = dados.mensagem;

        const protocolo = document.createElement("strong");
        protocolo.textContent = `Protocolo: ${ocorrencia.protocolo}`;

        const status = document.createElement("p");
        status.textContent = `Status: ${ocorrencia.status}`;

        const orientacao = document.createElement("p");
        orientacao.textContent =
            "Guarde este protocolo para acompanhar sua ocorrência.";

        mensagem.append(
            confirmacao,
            document.createElement("br"),
            document.createElement("br"),
            protocolo,
            status,
            orientacao
        );

        form.reset();

        const contador = document.querySelector(".contador");

        if (contador) {
            contador.textContent = "0/1000";
        }

    } catch (erro) {
        console.error("Erro ao enviar ocorrência:", erro);
        mensagem.textContent = erro.message ||
            "Não foi possível registrar a ocorrência.";
    } finally {
        botaoEnviar.disabled = false;
        botaoEnviar.textContent = "ENVIAR DENÚNCIA";
    }
});

// ACOMPANHAR OCORRÊNCIA
formAcompanhamento.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const protocolo = document.getElementById("protocolo").value.trim();

    resultado.style.display = "block";
    resultado.textContent = "Consultando ocorrência...";

    if (!protocolo) {
        resultado.textContent = "Informe o número do protocolo.";
        return;
    }

    try {
        const resposta = await fetch(
            `/ocorrencias/protocolo/${encodeURIComponent(protocolo)}`,
            {
                method: "GET",
                headers: cabecalhoAutenticado()
            }
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                dados.mensagem || "Não foi possível consultar a ocorrência."
            );
        }

        resultado.textContent = "";

        const titulo = document.createElement("strong");
        titulo.textContent = `Ocorrência nº ${dados.protocolo}`;

        const etapaEnviada = document.createElement("p");
        etapaEnviada.textContent = "✓ Ocorrência enviada";

        const etapaStatus = document.createElement("p");
        etapaStatus.textContent = `● Status: ${dados.status}`;

        const andamento = document.createElement("div");
        andamento.className = "andamento";
        andamento.append(etapaEnviada, etapaStatus);

        resultado.append(
            titulo,
            document.createElement("br"),
            document.createElement("br"),
            andamento
        );

    } catch (erro) {
        console.error("Erro ao consultar ocorrência:", erro);

        resultado.textContent = "";

        const aviso = document.createElement("strong");
        aviso.textContent = "Não foi possível localizar a ocorrência.";

        const orientacao = document.createElement("p");
        orientacao.textContent = erro.message ||
            "Verifique o protocolo informado e tente novamente.";

        resultado.append(aviso, orientacao);
    }
});

// NAVEGAÇÃO ENTRE TELAS
linkAcompanhamento.addEventListener("click", (evento) => {
    evento.preventDefault();

    telaDenuncia.style.display = "none";
    telaAcompanhamento.style.display = "block";

    linkDenuncia.classList.remove("ativo");
    linkAcompanhamento.classList.add("ativo");
});

linkDenuncia.addEventListener("click", (evento) => {
    evento.preventDefault();

    telaDenuncia.style.display = "block";
    telaAcompanhamento.style.display = "none";

    linkAcompanhamento.classList.remove("ativo");
    linkDenuncia.classList.add("ativo");
});
