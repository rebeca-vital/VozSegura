const { spawn } = require("child_process");

const denuncia = "Um aluno me bateu durante o intervalo.";

const python = spawn("python", [
    "machine-learning/prever.py",
    denuncia
]);

python.stdout.on("data", (dados) => {
    console.log("Resposta do Python:");
    console.log(dados.toString());
});

python.stderr.on("data", (erro) => {
    console.error("Erro do Python:");
    console.error(erro.toString());
});

python.on("close", (codigo) => {
    console.log(`Python finalizado com código: ${codigo}`);
});