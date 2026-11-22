
console.log("LOGIN.JS FOI CARREGADO!");

const formLogin = document.getElementById("formLogin");
const instituicao = document.getElementById("instituicao");
const botoesPerfil = document.querySelectorAll(".perfil");
const labelIdentificador = document.getElementById("labelIdentificador");
const identificador = document.getElementById("identificador");
const senha = document.getElementById("senha");
const mensagem = document.getElementById("mensagem");
const alternarSenha = document.getElementById("alternarSenha");

let perfilSelecionado = "Aluno";

// ÍCONES DO OLHO
const iconeOlhoAberto = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"/>
        <circle cx="12" cy="12" r="3"/>
    </svg>
`;

const iconeOlhoFechado = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m3 3 18 18"/>
        <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8"/>
        <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c6.4 0 10 7 10 7a16 16 0 0 1-3.1 3.9"/>
        <path d="M6.2 6.2C3.5 8.1 2 12 2 12s3.6 7 10 7a10 10 0 0 0 4-.8"/>
    </svg>
`;

// CARREGAR INSTITUIÇÕES
async function carregarInstituicoes() {
    try {
        const resposta = await fetch("/instituicoes");

        if (!resposta.ok) {
            throw new Error("Erro ao buscar instituições.");
        }

        const instituicoes = await resposta.json();

        instituicao.innerHTML =
            '<option value="">Selecione sua escola</option>';

        instituicoes.forEach(escola => {
            const opcao = document.createElement("option");

            opcao.value = escola.id;
            opcao.textContent = escola.nome;

            instituicao.appendChild(opcao);
        });

    } catch (erro) {
        console.error(erro);

        instituicao.innerHTML =
            '<option value="">Não foi possível carregar as escolas</option>';
    }
}

// ALTERNAR ENTRE ALUNO E GESTÃO
botoesPerfil.forEach(botao => {
    botao.addEventListener("click", () => {
        botoesPerfil.forEach(item => {
            item.classList.remove("ativo");
            item.setAttribute("aria-pressed", "false");
        });

        botao.classList.add("ativo");
        botao.setAttribute("aria-pressed", "true");

        perfilSelecionado = botao.dataset.perfil;

        if (perfilSelecionado === "Aluno") {
            labelIdentificador.textContent = "Matrícula";
            identificador.placeholder = "Digite sua matrícula";
            identificador.setAttribute("aria-label", "Matrícula");
        } else {
            labelIdentificador.textContent = "Login";
            identificador.placeholder = "Digite seu login";
            identificador.setAttribute("aria-label", "Login");
        }

        identificador.value = "";
        mensagem.textContent = "";
        mensagem.style.color = "";

        // Ao trocar o perfil, limpa a senha e volta a ocultá-la.
        senha.value = "";
        senha.type = "password";

        alternarSenha.innerHTML = iconeOlhoAberto;
        alternarSenha.setAttribute("aria-label", "Mostrar senha");
        alternarSenha.setAttribute("aria-pressed", "false");
    });
});

// MOSTRAR OU OCULTAR SENHA
alternarSenha.addEventListener("click", () => {
    const senhaEstaOculta = senha.type === "password";

    if (senhaEstaOculta) {
        senha.type = "text";
        alternarSenha.innerHTML = iconeOlhoFechado;
        alternarSenha.setAttribute("aria-label", "Ocultar senha");
        alternarSenha.setAttribute("aria-pressed", "true");
    } else {
        senha.type = "password";
        alternarSenha.innerHTML = iconeOlhoAberto;
        alternarSenha.setAttribute("aria-label", "Mostrar senha");
        alternarSenha.setAttribute("aria-pressed", "false");
    }

    senha.focus();
});

// REALIZAR LOGIN
formLogin.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    mensagem.textContent = "";
    mensagem.style.color = "";

    if (!instituicao.value) {
        mensagem.textContent = "Selecione sua instituição.";
        return;
    }

    if (!identificador.value.trim()) {
        mensagem.textContent =
            perfilSelecionado === "Aluno"
                ? "Digite sua matrícula."
                : "Digite seu login.";

        identificador.focus();
        return;
    }

    if (!senha.value) {
        mensagem.textContent = "Digite sua senha.";
        senha.focus();
        return;
    }

    const dados = {
        instituicaoId: instituicao.value,
        perfil: perfilSelecionado,
        senha: senha.value
    };

    if (perfilSelecionado === "Aluno") {
        dados.matricula = identificador.value.trim();
    } else {
        dados.login = identificador.value.trim();
    }

    const botaoEntrar = formLogin.querySelector(".entrar");
    botaoEntrar.disabled = true;

    mensagem.textContent = "Verificando seus dados...";
    mensagem.style.color = "#718096";

    try {
        const resposta = await fetch("/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(dados)
        });

        const resultado = await resposta.json();

        if (!resposta.ok) {
            mensagem.style.color = "#C62828";
            mensagem.textContent =
                resultado.mensagem || "Não foi possível realizar o login.";

            return;
        }

        // GUARDAR DADOS DA SESSÃO
        sessionStorage.setItem("token", resultado.token);

        sessionStorage.setItem(
            "usuario",
            JSON.stringify(resultado.usuario)
        );

        mensagem.style.color = "green";
        mensagem.textContent = "Login realizado com sucesso!";

        // REDIRECIONAR CONFORME O PERFIL
        if (resultado.usuario.perfil === "Aluno") {
            window.location.href = "aluno.html";
        } else {
            window.location.href = "gestao.html";
        }

    } catch (erro) {
        console.error("Erro no login:", erro);

        mensagem.style.color = "#C62828";
        mensagem.textContent =
            "Erro de comunicação com o servidor.";

    } finally {
        botaoEntrar.disabled = false;
    }
});

// INICIAR
carregarInstituicoes();
