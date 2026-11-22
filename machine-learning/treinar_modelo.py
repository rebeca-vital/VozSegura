
from pathlib import Path

import joblib
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix
)

# Caminhos dos arquivos
PASTA = Path(__file__).resolve().parent
ARQUIVO_DADOS = PASTA / "denuncias_revisadas.csv"

ARQUIVO_MODELO = PASTA / "modelo_prioridade_teste.pkl"
ARQUIVO_VETORIZADOR = PASTA / "vetorizador_teste.pkl"

print("=" * 45)
print("VOZSEGURA - TREINAMENTO DO MODELO")
print("=" * 45)

# 1. Carregar a nova base
dados = pd.read_csv(ARQUIVO_DADOS, encoding="utf-8-sig")

colunas_obrigatorias = {"texto", "prioridade"}

if not colunas_obrigatorias.issubset(dados.columns):
    raise ValueError(
        "A base precisa conter as colunas 'texto' e 'prioridade'."
    )

dados = dados.dropna(subset=["texto", "prioridade"]).copy()
dados["texto"] = dados["texto"].astype(str).str.strip()
dados["prioridade"] = dados["prioridade"].astype(str).str.strip()
dados = dados[dados["texto"] != ""]

prioridades_validas = {"Alta", "Média", "Baixa"}
prioridades_encontradas = set(dados["prioridade"].unique())

if prioridades_encontradas != prioridades_validas:
    raise ValueError(
        f"Confira as prioridades da base: {prioridades_encontradas}"
    )

print(f"\nTotal de denúncias: {len(dados)}")
print("\nDistribuição das prioridades:")
print(dados["prioridade"].value_counts().to_string())

# 2. Separar textos e classificações
textos = dados["texto"]
prioridades = dados["prioridade"]

# 3. Separar dados de treinamento e avaliação
textos_treino, textos_teste, prioridades_treino, prioridades_teste = (
    train_test_split(
        textos,
        prioridades,
        test_size=0.20,
        random_state=42,
        stratify=prioridades
    )
)

# 4. Transformar os textos em números
vetorizador = TfidfVectorizer(
    lowercase=True,
    ngram_range=(1, 2)
)

textos_treino_tfidf = vetorizador.fit_transform(textos_treino)
textos_teste_tfidf = vetorizador.transform(textos_teste)

# 5. Treinar o classificador
modelo = LogisticRegression(
    max_iter=1000,
    random_state=42
)

modelo.fit(textos_treino_tfidf, prioridades_treino)

# 6. Avaliar nos dados separados para teste
previsoes = modelo.predict(textos_teste_tfidf)

acuracia = accuracy_score(prioridades_teste, previsoes)

print(f"\nAcurácia nos dados de teste: {acuracia:.2%}")

print("\nRelatório por prioridade:")
print(
    classification_report(
        prioridades_teste,
        previsoes,
        labels=["Alta", "Média", "Baixa"],
        zero_division=0
    )
)

print("Matriz de confusão (ordem: Alta, Média, Baixa):")
print(
    confusion_matrix(
        prioridades_teste,
        previsoes,
        labels=["Alta", "Média", "Baixa"]
    )
)

# 7. Testar exemplos novos
novas_denuncias = [
    "Um aluno disse que vai me bater quando eu sair da escola.",
    "Meus colegas fazem piadas sobre minha aparência todos os dias.",
    "Um estudante me fez um comentário ofensivo uma única vez.",
    "Um grupo de alunos me empurrou e continuou me agredindo."
]

novas_denuncias_tfidf = vetorizador.transform(novas_denuncias)
previsoes_novas = modelo.predict(novas_denuncias_tfidf)

print("\nTESTE DE NOVAS DENÚNCIAS")

for texto, prioridade in zip(novas_denuncias, previsoes_novas):
    print(f"\nDenúncia: {texto}")
    print(f"Prioridade prevista: {prioridade}")

# 8. Salvar em arquivos separados, sem substituir o modelo atual
joblib.dump(modelo, ARQUIVO_MODELO)
joblib.dump(vetorizador, ARQUIVO_VETORIZADOR)

print("\nTreinamento concluído.")
print(f"Novo modelo: {ARQUIVO_MODELO.name}")
print(f"Novo vetorizador: {ARQUIVO_VETORIZADOR.name}")
print("\nO modelo antigo foi preservado.")
