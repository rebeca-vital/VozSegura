
import json
import joblib
import os
import sys
import unicodedata

pasta_atual = os.path.dirname(os.path.abspath(__file__))

caminho_modelo = os.path.join(
    pasta_atual, "modelo_prioridade.pkl"
)
caminho_vetorizador = os.path.join(
    pasta_atual, "vetorizador.pkl"
)

# Indícios iniciais de violência escolar.
# Este filtro é uma proteção básica, não uma compreensão
# completa do significado da denúncia.
INDICIOS_VIOLENCIA = [
    "violencia", "agressao", "agredir", "agrediu",
    "bater", "bateu", "apanhar", "apanhou",
    "soco", "chute", "chutou", "empurrou", "tapa",
    "ameaca", "ameacou", "ameacar",
    "bullying", "intimidacao", "intimidar",
    "humilhar", "humilhacao", "humilhado",
    "perseguir", "perseguicao", "perseguem",
    "apelido ofensivo", "apelidos ofensivos",
    "xingamento", "xingou", "xingam",
    "ofensa", "ofensas", "ofendeu", "ofendem",
    "insulto", "insultou", "ridicularizar",
    "ridiculariza", "ridicularizam",
    "assedio", "discriminacao", "maltratar",
    "maltratou", "machucar", "machucou",
    "excluir", "excluem", "exclusao",
    "humilhacao virtual", "cyberbullying",
    "medo de sair", "medo de ir a escola"
]


def normalizar(texto):
    texto = texto.lower().strip()
    texto = unicodedata.normalize("NFD", texto)
    return "".join(
        caractere
        for caractere in texto
        if unicodedata.category(caractere) != "Mn"
    )


try:
    if len(sys.argv) < 2 or not sys.argv[1].strip():
        raise ValueError("A descrição da denúncia não foi informada.")

    denuncia = sys.argv[1].strip()
    denuncia_normalizada = normalizar(denuncia)

    # Se não houver indícios iniciais, solicitar mais informações
    # em vez de atribuir prioridade baixa automaticamente.
    tem_indicio = any(
        normalizar(indicio) in denuncia_normalizada
        for indicio in INDICIOS_VIOLENCIA
    )

    if not tem_indicio:
        print(json.dumps({
            "fora_escopo": True,
            "prioridade": None,
            "mensagem": (
                "Não foram identificados indícios suficientes "
                "de violência escolar. Revise ou complemente "
                "a descrição."
            )
        }, ensure_ascii=False))
        sys.exit(0)

    modelo = joblib.load(caminho_modelo)
    vetorizador = joblib.load(caminho_vetorizador)

    denuncia_tfidf = vetorizador.transform([denuncia])
    prioridade = str(modelo.predict(denuncia_tfidf)[0])

    print(json.dumps({
        "fora_escopo": False,
        "prioridade": prioridade
    }, ensure_ascii=False))

except Exception as erro:
    print(f"Erro na previsão: {erro}", file=sys.stderr)
    sys.exit(1)

