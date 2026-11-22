import csv
import random

random.seed(42)

modelos = [
    {
        "categoria": "Bullying",
        "prioridades": ["Baixa", "Média"],
        "frases": [
            "Um aluno coloca apelidos ofensivos em mim durante as aulas.",
            "Meus colegas fazem piadas sobre minha aparência.",
            "Um grupo de estudantes ri de mim quando entro na sala.",
            "Um aluno sempre tenta me constranger na frente da turma.",
            "Colegas ficam fazendo comentários ofensivos sobre meu jeito de falar.",
            "Um estudante faz brincadeiras comigo mesmo depois de eu pedir para parar.",
            "Alguns alunos ficam me excluindo das atividades da turma.",
            "Um grupo de colegas espalha apelidos desagradáveis sobre mim.",
            "Um aluno fica zombando de mim durante o intervalo.",
            "Meus colegas fazem comentários sobre minhas roupas para me humilhar.",
            "Um estudante incentiva outros alunos a rirem de mim.",
            "Estou sendo alvo de brincadeiras ofensivas todos os dias.",
            "Alguns colegas ficam me provocando repetidamente na escola.",
            "Um aluno tira sarro de mim sempre que participo da aula.",
            "Colegas fazem comentários que me deixam constrangido diante dos outros.",
            "Um grupo de estudantes fica me isolando durante as atividades.",
            "Um aluno espalha apelidos ofensivos entre meus colegas.",
            "Meus colegas fazem brincadeiras comigo que já pedi para interromper.",
            "Um estudante fica me ridicularizando durante o recreio.",
            "Alguns alunos ficam debochando de mim na sala.",
            "Um grupo de colegas não me deixa participar das atividades.",
            "Um aluno faz comentários ofensivos sempre que me vê.",
            "Estou sendo provocado por colegas durante vários dias.",
            "Colegas ficam rindo de mim e tentando me constranger.",
            "Um estudante costuma me humilhar com brincadeiras na frente da turma."
        ]
    },

    {
        "categoria": "Ameaça",
        "prioridade": "Alta",
        "frases": [
            "Um aluno disse que vai me bater na saída da escola.",
            "Uma colega ameaçou me agredir depois da aula.",
            "Um estudante falou que vai me machucar se eu contar o ocorrido.",
            "Um grupo de alunos disse que vai me atacar amanhã.",
            "Um colega afirmou que vai esperar por mim na saída para me bater.",
            "Recebi uma ameaça de agressão de outro estudante.",
            "Um aluno disse que vai me machucar durante o intervalo.",
            "Um grupo de estudantes ameaçou me bater caso eu procure ajuda.",
            "Uma colega falou que vai me agredir quando eu estiver sozinho.",
            "Um estudante ameaçou me atacar depois da aula.",
            "Disseram que vão me bater se eu contar para a direção.",
            "Um aluno afirmou que pretende me agredir na saída.",
            "Recebi ameaças de violência de um grupo de colegas.",
            "Um estudante disse que vai me machucar por ter contado o que aconteceu.",
            "Uma colega ameaçou partir para a agressão durante o recreio.",
            "Um aluno falou que vai me bater no caminho para casa.",
            "Estou recebendo ameaças de agressão dentro da escola.",
            "Um grupo de estudantes disse que vai me machucar se eu denunciar.",
            "Um colega me ameaçou dizendo que vai me agredir amanhã.",
            "Um estudante afirmou que vai me atacar quando eu sair da escola.",
            "Fui ameaçado por um aluno durante uma discussão.",
            "Uma colega disse que vai me bater caso eu conte para alguém.",
            "Um grupo de alunos fez ameaças de agressão contra mim.",
            "Um estudante me ameaçou de violência durante o intervalo.",
            "Disseram que vão me agredir depois da aula."
        ]
    },

    {
        "categoria": "Violência física",
        "prioridade": "Alta",
        "frases": [
            "Um aluno me agrediu durante uma discussão.",
            "Uma colega me empurrou com força no corredor.",
            "Dois estudantes começaram uma briga e eu fui atingido.",
            "Um aluno tentou me bater durante o intervalo.",
            "Um grupo de estudantes me empurrou durante uma discussão.",
            "Uma colega me deu um tapa dentro da sala.",
            "Um estudante me chutou durante uma briga.",
            "Fui agredido por outro aluno no recreio.",
            "Um aluno me segurou e tentou me machucar.",
            "Dois colegas brigaram e um deles acabou me atingindo.",
            "Um estudante jogou um objeto em mim durante uma discussão.",
            "Um aluno me bateu depois de uma discussão.",
            "Fui empurrado contra a parede por outro estudante.",
            "Uma colega tentou me agredir no corredor.",
            "Um grupo de alunos tentou me machucar durante uma briga.",
            "Um estudante me deu um soco durante uma discussão.",
            "Um aluno me agrediu fisicamente durante o recreio.",
            "Fui atingido por um colega durante uma briga.",
            "Uma estudante me empurrou e eu caí no chão.",
            "Um aluno tentou me bater dentro da escola.",
            "Dois estudantes começaram uma briga e me machucaram.",
            "Um colega me agrediu depois de uma discussão.",
            "Um estudante me empurrou e tentou continuar a agressão.",
            "Fui machucado fisicamente por outro aluno.",
            "Um grupo de estudantes tentou me agredir durante o intervalo."
        ]
    },

    {
        "categoria": "Violência psicológica",
        "prioridade": "Média",
        "frases": [
            "Um aluno fica me humilhando na frente da turma.",
            "Uma colega faz comentários ofensivos sobre mim constantemente.",
            "Um estudante tenta me intimidar durante as aulas.",
            "Um aluno fica me constrangendo sempre que estou na sala.",
            "Colegas fazem comentários para me deixar emocionalmente abalado.",
            "Um estudante tenta me diminuir na frente dos outros alunos.",
            "Um aluno faz comentários que me deixam muito constrangido.",
            "Estou sendo intimidado por colegas durante as aulas.",
            "Uma colega tenta me humilhar sempre que participo da aula.",
            "Um estudante fica fazendo comentários para me deixar com medo.",
            "Colegas tentam me fazer sentir inferior durante as atividades.",
            "Um aluno me constrange diante da turma com frequência.",
            "Estou sofrendo humilhações constantes dentro da escola.",
            "Um estudante faz comentários ofensivos para me deixar abalado.",
            "Uma colega tenta me intimidar durante o intervalo.",
            "Um grupo de estudantes fica tentando me constranger.",
            "Um aluno faz comentários que afetam meu emocional.",
            "Colegas ficam tentando me intimidar durante as atividades.",
            "Um estudante me humilha sempre que tenho que falar em público.",
            "Estou sendo alvo de provocações que estão afetando meu emocional.",
            "Um aluno tenta me colocar em situação constrangedora diante da turma.",
            "Uma colega faz comentários que me deixam muito mal.",
            "Um grupo de estudantes tenta me intimidar na escola.",
            "Um estudante fica me humilhando durante as aulas.",
            "Colegas fazem comentários ofensivos que estão afetando meu emocional."
        ]
    }
]

denuncias = []

for modelo in modelos:
    frases = modelo["frases"].copy()
    random.shuffle(frases)

    for texto in frases[:25]:
        if "prioridades" in modelo:
            prioridade = random.choice(modelo["prioridades"])
        else:
            prioridade = modelo["prioridade"] 
        denuncias.append({
            "id": len(denuncias) + 1,
            "texto": texto,
            "categoria": modelo["categoria"],
            "prioridade": prioridade
        })

random.shuffle(denuncias)

for numero, denuncia in enumerate(denuncias, start=1):
    denuncia["id"] = numero

with open("denuncias.csv", "w", newline="", encoding="utf-8") as arquivo:
    campos = ["id", "texto", "categoria", "prioridade"]

    escritor = csv.DictWriter(arquivo, fieldnames=campos)
    escritor.writeheader()
    escritor.writerows(denuncias)

print(f"Total de denúncias geradas: {len(denuncias)}")
print("Arquivo criado: denuncias.csv")

print("\nPrimeiras cinco denúncias:")

for denuncia in denuncias[:5]:
    print(denuncia)

print("\nDistribuição das prioridades:")

contagem = {}

for denuncia in denuncias:
    prioridade = denuncia["prioridade"]

    if prioridade not in contagem:
        contagem[prioridade] = 0

    contagem[prioridade] += 1

for prioridade, quantidade in contagem.items():
    print(f"{prioridade}: {quantidade}")