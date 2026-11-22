
import os
import joblib

pasta = os.path.dirname(os.path.abspath(__file__))

# Modelos que serão comparados
arquivos = {
    "Modelo atual": (
        "modelo_prioridade.pkl",
        "vetorizador.pkl"
    ),
    "Modelo experimental": (
        "modelo_prioridade_teste.pkl",
        "vetorizador_teste.pkl"
    )
}

# Denúncias independentes para avaliação
testes = [
    (
        "Um grupo cercou um estudante no corredor, "
        "deu vários chutes e impediu que ele saísse.",
        "Alta"
    ),
    (
        "Recebi uma mensagem dizendo que vão me machucar "
        "na saída da escola.",
        "Alta"
    ),
    (
        "Um aluno derrubou outro no chão e continuou batendo.",
        "Alta"
    ),
    (
        "Meus colegas escondem minha mochila e me chamam "
        "por apelidos ofensivos há várias semanas.",
        "Média"
    ),
    (
        "Um grupo me exclui repetidamente das atividades "
        "e faz comentários humilhantes.",
        "Média"
    ),
    (
        "Estão compartilhando montagens para me ridicularizar "
        "nas redes sociais há vários dias.",
        "Média"
    ),
    (
        "Um colega fez uma piada ofensiva comigo uma única vez.",
        "Baixa"
    ),
    (
        "Durante uma atividade, um aluno disse que minha ideia "
        "era ridícula. Foi um episódio isolado, sem ameaças.",
        "Baixa"
    ),
    (
        "Um estudante respondeu de maneira grosseira uma vez, "
        "sem agressão ou ameaça.",
        "Baixa"
    )
]


def carregar_modelo(nome_modelo, nome_vetorizador):
    caminho_modelo = os.path.join(pasta, nome_modelo)
    caminho_vetorizador = os.path.join(pasta, nome_vetorizador)

    modelo = joblib.load(caminho_modelo)
    vetorizador = joblib.load(caminho_vetorizador)

    return modelo, vetorizador


def avaliar(nome, modelo, vetorizador):
    print("\n" + "=" * 55)
    print(nome.upper())
    print("=" * 55)

    acertos = 0

    for numero, (denuncia, esperado) in enumerate(testes, start=1):
        texto_transformado = vetorizador.transform([denuncia])
        previsto = str(modelo.predict(texto_transformado)[0])

        correto = previsto == esperado

        if correto:
            acertos += 1

        print(f"\nTESTE {numero}")
        print(f"Denúncia: {denuncia}")
        print(f"Esperado: {esperado}")
        print(f"Previsto: {previsto}")
        print(f"Resultado: {'ACERTO' if correto else 'ERRO'}")

    total = len(testes)
    percentual = (acertos / total) * 100

    print("\n" + "-" * 55)
    print(f"RESULTADO FINAL: {acertos}/{total}")
    print(f"ACURÁCIA: {percentual:.2f}%")

    return acertos


resultados = {}

for nome, (arquivo_modelo, arquivo_vetorizador) in arquivos.items():
    modelo, vetorizador = carregar_modelo(
        arquivo_modelo,
        arquivo_vetorizador
    )

    resultados[nome] = avaliar(nome, modelo, vetorizador)


print("\n" + "=" * 55)
print("COMPARAÇÃO FINAL")
print("=" * 55)

for nome, acertos in resultados.items():
    print(f"{nome}: {acertos}/{len(testes)} acertos")

print("\nNenhum modelo foi modificado.")
