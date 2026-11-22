
// ======================================================
// VOZSEGURA — PAINEL DE GESTÃO
// ======================================================

const token = sessionStorage.getItem("token");
const usuario = JSON.parse(sessionStorage.getItem("usuario") || "null");

const nomeInstituicao = document.getElementById("nomeInstituicao");
const nomeGestor = document.getElementById("nomeGestor");

let ocorrencias = [];
let instituicao = null;
let graficoPrioridade = null;
let graficoMensal = null;
let denunciaSelecionada = null;

if (!token || !usuario || usuario.perfil !== "Gestao") {
    sessionStorage.clear();
    window.location.href = "login.html";
}

// ======================================================
// FUNÇÕES AUXILIARES
// ======================================================

function criarElemento(tag, texto, classe) {
    const elemento = document.createElement(tag);

    if (texto !== undefined && texto !== null) {
        elemento.textContent = texto;
    }

    if (classe) elemento.className = classe;

    return elemento;
}

function formatarData(data) {
    if (!data) return "—";

    const dataFormatada = new Date(data);

    if (Number.isNaN(dataFormatada.getTime())) return "—";

    return dataFormatada.toLocaleDateString("pt-BR");
}

function classeStatus(status) {
    if (status === "Resolvida") return "status status-resolvida";
    if (status === "Em análise") return "status status-analise";

    return "status status-recebida";
}

function classePrioridade(prioridade) {
    if (prioridade === "Alta") return "prioridade prioridade-alta";
    if (prioridade === "Média") return "prioridade prioridade-media";

    return "prioridade prioridade-baixa";
}

function criarEtiqueta(texto, classe) {
    return criarElemento("span", texto || "—", classe);
}

function adicionarCelula(linha, conteudo) {
    const celula = document.createElement("td");

    if (conteudo instanceof Node) {
        celula.appendChild(conteudo);
    } else {
        celula.textContent = conteudo ?? "—";
    }

    linha.appendChild(celula);

    return celula;
}

function mostrarMensagem(elementoId, mostrar) {
    const elemento = document.getElementById(elementoId);

    if (elemento) elemento.hidden = !mostrar;
}

function obterClassificacoes(ocorrencia) {
    let classificacoes =
        ocorrencia.classificacoes ??
        ocorrencia.classificacao ??
        ocorrencia.categorias ??
        [];

    if (typeof classificacoes === "string") {
        try {
            const resultado = JSON.parse(classificacoes);

            classificacoes = Array.isArray(resultado)
                ? resultado
                : [classificacoes];

        } catch {
            classificacoes = [classificacoes];
        }
    }

    if (!Array.isArray(classificacoes)) {
        classificacoes = classificacoes ? [classificacoes] : [];
    }

    return classificacoes
        .map(item => {
            if (typeof item === "string") return item;

            return item?.nome || item?.descricao || item?.classificacao || "";
        })
        .filter(Boolean);
}

function obterPrioridade(p) {
    const prioridades = {
        "Alta": 1,
        "Média": 2,
        "Baixa": 3
    };

    return prioridades[p] || 4;
}

function ordenarOcorrencias(lista) {
    return [...lista].sort((a, b) => {
        const diferencaPrioridade =
            obterPrioridade(a.prioridade) - obterPrioridade(b.prioridade);

        if (diferencaPrioridade !== 0) {
            return diferencaPrioridade;
        }

        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
    });
}

function criarListaClassificacoes(ocorrencia) {
    const container = criarElemento("div", undefined, "lista-classificacoes");

    const classificacoes = obterClassificacoes(ocorrencia);

    if (classificacoes.length === 0) {
        container.appendChild(
            criarElemento("span", "Não informada", "texto-sem-classificacao")
        );

        return container;
    }

    classificacoes.forEach(classificacao => {
        container.appendChild(
            criarElemento(
                "span",
                classificacao,
                "etiqueta-classificacao"
            )
        );
    });

    return container;
}

// ======================================================
// NAVEGAÇÃO
// ======================================================

function abrirTela(nomeTela) {
    document.querySelectorAll(".view").forEach(tela => {
        tela.classList.toggle("ativa", tela.dataset.page === nomeTela);
    });

    document.querySelectorAll(".menu-item[data-view]").forEach(botao => {
        botao.classList.toggle("ativo", botao.dataset.view === nomeTela);
    });

    document.getElementById("sidebar").classList.remove("aberta");

    if (nomeTela === "relatorios") {
        setTimeout(atualizarGraficos, 100);
    }
}

document.querySelectorAll(".menu-item[data-view]").forEach(botao => {
    botao.addEventListener("click", () => {
        abrirTela(botao.dataset.view);
    });
});

document.querySelectorAll("[data-ir]").forEach(botao => {
    botao.addEventListener("click", () => {
        abrirTela(botao.dataset.ir);
    });
});

document.getElementById("btnMenuMobile").addEventListener("click", () => {
    document.getElementById("sidebar").classList.toggle("aberta");
});

document.getElementById("btnSair").addEventListener("click", () => {
    sessionStorage.clear();
    window.location.href = "login.html";
});

// ======================================================
// NOTIFICAÇÕES — INTERFACE PREPARADA
// ======================================================

const btnNotificacoes = document.getElementById("btnNotificacoes");
const painelNotificacoes = document.getElementById("painelNotificacoes");

btnNotificacoes.addEventListener("click", () => {
    const estaAberto = !painelNotificacoes.hidden;

    painelNotificacoes.hidden = estaAberto;

    btnNotificacoes.setAttribute(
        "aria-expanded",
        String(!estaAberto)
    );
});

document.addEventListener("click", evento => {
    const area = document.querySelector(".area-notificacoes");

    if (!area.contains(evento.target)) {
        painelNotificacoes.hidden = true;
        btnNotificacoes.setAttribute("aria-expanded", "false");
    }
});

function renderizarNotificacoes() {
    const lista = document.getElementById("listaNotificacoes");

    lista.replaceChildren();

    const mensagem = criarElemento(
        "p",
        "As notificações de novas denúncias serão exibidas aqui.",
        "notificacoes-vazias"
    );

    lista.appendChild(mensagem);

    document.getElementById("contadorNotificacoes").hidden = true;
    document.getElementById("totalNotificacoes").textContent = "0";
}

renderizarNotificacoes();

// ======================================================
// CARREGAR DADOS DO BACKEND
// ======================================================

async function carregarInstituicao() {
    const resposta = await fetch("/gestao/instituicao", {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
        throw new Error(
            dados.mensagem || "Não foi possível carregar a instituição."
        );
    }

    instituicao = dados;

    nomeInstituicao.textContent = dados.nome || "Instituição";
    nomeGestor.textContent = usuario.nome || "Gestor(a)";

    document.getElementById("configNome").textContent =
        usuario.nome || "—";

    document.getElementById("configInstituicao").textContent =
        dados.nome || "—";

    document.getElementById("configMunicipio").textContent =
        [dados.municipio, dados.uf].filter(Boolean).join(" - ") || "—";
}

async function carregarOcorrencias() {
    const resposta = await fetch("/ocorrencias", {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
        throw new Error(
            dados.mensagem || "Não foi possível carregar as denúncias."
        );
    }

    ocorrencias = Array.isArray(dados) ? dados : [];

    atualizarPainel();
    renderizarDenuncias();
    atualizarRelatorios();
}

// ======================================================
// PAINEL INICIAL
// ======================================================

function atualizarPainel() {
    const recebidas = ocorrencias.filter(
        item => item.status === "Recebida"
    ).length;

    const emAnalise = ocorrencias.filter(
        item => item.status === "Em análise"
    ).length;

    const resolvidas = ocorrencias.filter(
        item => item.status === "Resolvida"
    ).length;

    const prioridadeAlta = ocorrencias.filter(
        item => item.prioridade === "Alta" &&
        item.status !== "Resolvida"
    ).length;

    document.getElementById("totalOcorrencias").textContent =
        ocorrencias.length;

    document.getElementById("totalRecebidas").textContent =
        recebidas;

    document.getElementById("totalAnalise").textContent =
        emAnalise;

    document.getElementById("totalResolvidas").textContent =
        resolvidas;

    document.getElementById("totalPrioridadeAlta").textContent =
        prioridadeAlta;

    // O monitoramento de prazos será ligado ao backend posteriormente.
    document.getElementById("totalPendencias").textContent = "—";

    const recentes = ordenarOcorrencias(ocorrencias)
        .slice(0, 5);

    const tabela = document.getElementById("tabelaRecentes");

    tabela.replaceChildren();

    recentes.forEach(ocorrencia => {
        const linha = document.createElement("tr");

        adicionarCelula(linha, ocorrencia.protocolo);

        adicionarCelula(
            linha,
            criarListaClassificacoes(ocorrencia)
        );

        adicionarCelula(
            linha,
            criarEtiqueta(
                ocorrencia.prioridade,
                classePrioridade(ocorrencia.prioridade)
            )
        );

        adicionarCelula(
            linha,
            criarEtiqueta(
                ocorrencia.status,
                classeStatus(ocorrencia.status)
            )
        );

        adicionarCelula(
            linha,
            formatarData(ocorrencia.createdAt)
        );

        tabela.appendChild(linha);
    });

    mostrarMensagem("vazioRecentes", recentes.length === 0);
}

// ======================================================
// TELA DE DENÚNCIAS
// ======================================================

function renderizarDenuncias() {
    const filtroStatus =
        document.getElementById("filtroStatusDenuncia").value;

    const filtroPrioridade =
        document.getElementById("filtroPrioridade").value;

    const filtradas = ordenarOcorrencias(ocorrencias).filter(ocorrencia => {
        return (
            (!filtroStatus || ocorrencia.status === filtroStatus) &&
            (!filtroPrioridade || ocorrencia.prioridade === filtroPrioridade)
        );
    });

    const tabela = document.getElementById("tabelaDenuncias");

    tabela.replaceChildren();

    filtradas.forEach(ocorrencia => {
        const linha = document.createElement("tr");

        adicionarCelula(linha, ocorrencia.protocolo);

        adicionarCelula(
            linha,
            criarListaClassificacoes(ocorrencia)
        );

        adicionarCelula(
            linha,
            criarEtiqueta(
                ocorrencia.prioridade,
                classePrioridade(ocorrencia.prioridade)
            )
        );

        adicionarCelula(
            linha,
            criarEtiqueta(
                ocorrencia.status,
                classeStatus(ocorrencia.status)
            )
        );

        adicionarCelula(
            linha,
            formatarData(ocorrencia.createdAt)
        );

        const botaoDetalhes = criarElemento(
            "button",
            "Ver denúncia",
            "botao-detalhes"
        );

        botaoDetalhes.type = "button";

        botaoDetalhes.addEventListener("click", () => {
            abrirDetalhesDenuncia(ocorrencia.id);
        });

        adicionarCelula(linha, botaoDetalhes);

        tabela.appendChild(linha);
    });

    mostrarMensagem("vazioDenuncias", filtradas.length === 0);
}

document.getElementById("filtroStatusDenuncia")
    .addEventListener("change", renderizarDenuncias);

document.getElementById("filtroPrioridade")
    .addEventListener("change", renderizarDenuncias);

// ======================================================
// DETALHES DA DENÚNCIA
// ======================================================

function abrirDetalhesDenuncia(id) {
    const ocorrencia = ocorrencias.find(
        item => String(item.id) === String(id)
    );

    if (!ocorrencia) {
        alert("Não foi possível localizar esta denúncia.");
        return;
    }

    denunciaSelecionada = ocorrencia;

    document.getElementById("modalProtocolo").textContent =
        ocorrencia.protocolo || "Protocolo não informado";

    document.getElementById("modalPrioridade").replaceChildren(
        criarEtiqueta(
            ocorrencia.prioridade,
            classePrioridade(ocorrencia.prioridade)
        )
    );

    document.getElementById("modalStatus").replaceChildren(
        criarEtiqueta(
            ocorrencia.status,
            classeStatus(ocorrencia.status)
        )
    );

    document.getElementById("modalData").textContent =
        formatarData(ocorrencia.createdAt);

    document.getElementById("modalClassificacoes").replaceChildren(
        criarListaClassificacoes(ocorrencia)
    );

    document.getElementById("modalDescricao").textContent =
        ocorrencia.descricao || "Relato não disponível.";

    document.getElementById("modalNovoStatus").value =
        ocorrencia.status || "Recebida";

    renderizarEvidencias(ocorrencia);

    document.getElementById("modalDenuncia").hidden = false;

    document.body.style.overflow = "hidden";
}

function fecharDetalhesDenuncia() {
    document.getElementById("modalDenuncia").hidden = true;
    document.body.style.overflow = "";

    denunciaSelecionada = null;
}

document.getElementById("fecharModalDenuncia")
    .addEventListener("click", fecharDetalhesDenuncia);

document.getElementById("modalDenuncia")
    .addEventListener("click", evento => {
        if (evento.target.id === "modalDenuncia") {
            fecharDetalhesDenuncia();
        }
    });

document.addEventListener("keydown", evento => {
    if (
        evento.key === "Escape" &&
        !document.getElementById("modalDenuncia").hidden
    ) {
        fecharDetalhesDenuncia();
    }
});

// ======================================================
// EVIDÊNCIAS
// ======================================================

function renderizarEvidencias(ocorrencia) {
    const container = document.getElementById("modalEvidencias");

    container.replaceChildren();

    const evidencias =
        ocorrencia.evidencias ||
        ocorrencia.anexos ||
        ocorrencia.arquivos ||
        [];

    if (!Array.isArray(evidencias) || evidencias.length === 0) {
        container.appendChild(
            criarElemento(
                "p",
                "Nenhuma evidência anexada."
            )
        );

        return;
    }

    evidencias.forEach(evidencia => {
        const caminho = typeof evidencia === "string"
            ? evidencia
            : evidencia.url || evidencia.caminho || evidencia.arquivo;

        if (!caminho) return;

        const endereco = String(caminho);

        const caminhoPermitido =
            endereco.startsWith("/") ||
            endereco.startsWith("uploads/") ||
            /^https?:\/\//i.test(endereco);

        if (!caminhoPermitido) return;

        const nome = typeof evidencia === "object"
            ? evidencia.nome || "Arquivo anexado"
            : endereco.split("/").pop();

        const link = document.createElement("a");

        link.href = endereco;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = nome;

        container.appendChild(link);
    });

    if (container.children.length === 0) {
        container.appendChild(
            criarElemento("p", "Nenhuma evidência disponível.")
        );
    }
}

// ======================================================
// ATUALIZAÇÃO DE STATUS
// ======================================================

document.getElementById("btnSalvarStatus")
    .addEventListener("click", async () => {
        if (!denunciaSelecionada) return;

        const novoStatus =
            document.getElementById("modalNovoStatus").value;

        await atualizarStatus(
            denunciaSelecionada.id,
            novoStatus
        );
    });

async function atualizarStatus(id, novoStatus) {
    const ocorrencia = ocorrencias.find(
        item => String(item.id) === String(id)
    );

    if (!ocorrencia) return;

    if (novoStatus === ocorrencia.status) {
        alert("Esse já é o status atual da denúncia.");
        return;
    }

    const confirmar = confirm(
        `Deseja alterar o status desta denúncia para "${novoStatus}"?`
    );

    if (!confirmar) return;

    const botao = document.getElementById("btnSalvarStatus");

    botao.disabled = true;
    botao.textContent = "Salvando...";

    try {
        const resposta = await fetch(`/ocorrencias/${id}/status`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                status: novoStatus
            })
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                dados.mensagem || "Não foi possível atualizar o status."
            );
        }

        alert("Status atualizado com sucesso!");

        fecharDetalhesDenuncia();

        await carregarOcorrencias();

    } catch (erro) {
        console.error("Erro ao atualizar status:", erro);

        alert(
            erro.message || "Erro ao atualizar o status."
        );

    } finally {
        botao.disabled = false;
        botao.textContent = "Salvar alteração";
    }
}

// ======================================================
// RELATÓRIOS
// ======================================================

function atualizarRelatorios() {
    const alta = ocorrencias.filter(
        item => item.prioridade === "Alta"
    ).length;

    const media = ocorrencias.filter(
        item => item.prioridade === "Média"
    ).length;

    const baixa = ocorrencias.filter(
        item => item.prioridade === "Baixa"
    ).length;

    document.getElementById("relTotal").textContent =
        ocorrencias.length;

    document.getElementById("relAlta").textContent = alta;
    document.getElementById("relMedia").textContent = media;
    document.getElementById("relBaixa").textContent = baixa;

    atualizarGraficos();
}

function atualizarGraficos() {
    if (typeof Chart === "undefined") return;

    const elementoPrioridade =
        document.getElementById("graficoPrioridade");

    const elementoMensal =
        document.getElementById("graficoMensal");

    if (!elementoPrioridade || !elementoMensal) return;

    const alta = ocorrencias.filter(
        item => item.prioridade === "Alta"
    ).length;

    const media = ocorrencias.filter(
        item => item.prioridade === "Média"
    ).length;

    const baixa = ocorrencias.filter(
        item => item.prioridade === "Baixa"
    ).length;

    if (graficoPrioridade) {
        graficoPrioridade.destroy();
    }

    graficoPrioridade = new Chart(elementoPrioridade, {
        type: "doughnut",

        data: {
            labels: ["Alta", "Média", "Baixa"],

            datasets: [{
                data: [alta, media, baixa],
                backgroundColor: [
                    "#E05252",
                    "#F2B84B",
                    "#36A875"
                ],
                borderWidth: 2,
                borderColor: "#FFFFFF"
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            plugins: {
                legend: {
                    position: "bottom",

                    labels: {
                        padding: 18,
                        usePointStyle: true,
                        font: {
                            size: 13
                        }
                    }
                }
            }
        }
    });

    const meses = [];
    const quantidades = [];
    const hoje = new Date();

    for (let i = 5; i >= 0; i--) {
        const data = new Date(
            hoje.getFullYear(),
            hoje.getMonth() - i,
            1
        );

        meses.push(
            data.toLocaleDateString("pt-BR", {
                month: "short"
            })
        );

        const quantidade = ocorrencias.filter(item => {
            if (!item.createdAt) return false;

            const dataOcorrencia = new Date(item.createdAt);

            return (
                dataOcorrencia.getMonth() === data.getMonth() &&
                dataOcorrencia.getFullYear() === data.getFullYear()
            );
        }).length;

        quantidades.push(quantidade);
    }

    if (graficoMensal) {
        graficoMensal.destroy();
    }

    graficoMensal = new Chart(elementoMensal, {
        type: "bar",

        data: {
            labels: meses,

            datasets: [{
                label: "Denúncias",
                data: quantidades,
                backgroundColor: "#FF5500",
                borderRadius: 6,
                maxBarThickness: 42
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            plugins: {
                legend: {
                    display: false
                }
            },

            scales: {
                y: {
                    beginAtZero: true,

                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
}

// ======================================================
// INICIALIZAÇÃO
// ======================================================

async function iniciarPainel() {
    try {
        await carregarInstituicao();
        await carregarOcorrencias();

    } catch (erro) {
        console.error("Erro ao iniciar painel:", erro);

        alert(
            erro.message ||
            "Não foi possível carregar o painel. Verifique sua conexão com o servidor."
        );
    }
}

iniciarPainel();
