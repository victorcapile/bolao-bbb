# Como Usar o Sistema de Apostas Binárias (Sim/Não)

## Visão Geral

O sistema de apostas binárias permite criar provas do tipo "Sim ou Não" com odds calculadas automaticamente baseadas na probabilidade do evento, oferecendo pontos proporcionais à dificuldade de acertar.

## Como Funciona

Ao invés de definir odds manualmente, você define a **probabilidade de SIM** (em %), e o sistema calcula automaticamente as odds para ambas as respostas:

**Exemplo:** "O Big Fone vai tocar essa semana?"
- **Probabilidade de SIM:** 20% (improvável)
- **Probabilidade de NÃO:** 80% (muito provável)

O sistema calcula:
- **Odds SIM:** 100 ÷ 20 = 5.0x → 5 pontos × 5.0 = **25 pontos**
- **Odds NÃO:** 100 ÷ 80 = 1.25x → 5 pontos × 1.25 = **6 pontos**

## Passo a Passo

### 1. Executar Scripts SQL no Supabase

Primeiro, execute os dois scripts SQL no seu banco de dados:

1. **ADICIONAR-APOSTAS-BINARIAS.sql** - Adiciona as colunas necessárias
2. **PONTUAR-APOSTAS-BINARIAS.sql** - Cria o trigger para pontuação automática

### 2. Criar uma Aposta Binária pelo Admin

1. Acesse o **Painel Admin**
2. Na seção "➕ Criar Prova", clique no botão **"Sim/Não"**
3. Preencha os campos:
   - **Pergunta:** Ex: "O Big Fone vai tocar essa semana?"
   - **Probabilidade de SIM (%):** Ex: 20% (o sistema calcula automaticamente a probabilidade de NÃO)
   - **Pontos base:** Valor base que será multiplicado (ex: 5)
4. Clique em **"Criar Prova"**

**Nota:** Data não é necessária - apostas binárias usam a data atual automaticamente.

### 3. Usuários Fazem Apostas

- Os usuários verão a pergunta na aba de apostas
- Dois botões grandes: **SIM** e **NÃO**
- Cada botão mostra:
  - Os pontos que podem ganhar
  - A odd aplicada
- Podem mudar o voto clicando em outra opção

### 4. Fechar a Aposta e Pontuar

1. No **Painel Admin**, na seção "🏆 Provas Abertas"
2. Encontre a aposta binária
3. Clique em **"✓ SIM"** ou **"✕ NÃO"** dependendo do resultado real
4. Os pontos serão calculados automaticamente:
   - Usuários que acertaram ganham: `pontos_base × odds`
   - Usuários que erraram ganham: `0 pontos`

## Entendendo o Sistema de Probabilidades

As odds são calculadas automaticamente baseadas na probabilidade:

**Fórmula:** `Odds = 100 ÷ Probabilidade (%)`

**Quanto menor a probabilidade, maiores as odds e mais pontos você ganha!**

- **20% de chance:** Odds = 5.0x → Muito improvável, muitos pontos
- **50% de chance:** Odds = 2.0x → Incerto, pontos médios
- **80% de chance:** Odds = 1.25x → Muito provável, poucos pontos

## 💡 Ideias de Apostas Sim/Não para BBB

### 🎯 Big Fone e Dinâmicas
- O Big Fone vai tocar esta semana?
- Alguém vai atender o Big Fone na primeira chamada?
- O Big Fone vai tocar durante a festa?
- Vai ter prova do bate e volta esta semana?
- A prova do líder será de resistência?
- Alguém vai desistir de uma prova esta semana?

### 🎭 Paredão e Votação
- Vai ter empate no paredão desta semana?
- O menos votado vai virar o jogo e escapar?
- Vai ter mais de 100 milhões de votos no paredão?

### 🎉 Festas e Comportamento
- Vai rolar beijo na festa desta semana?
- Vai ter briga/discussão acalorada esta semana?
- Alguém vai chorar na festa?
- Vai formar um novo casal esta semana?

### 🏠 Casa e Convivência
- Vai acabar a comida antes do fim da semana?
- Alguém vai dormir no quarto do líder esta semana?
- Vai ter festa surpresa esta semana?
- Vai ter choro no confessionário esta semana?

### 😇 Anjo e Monstro
- O anjo vai imunizar alguém do confessionário?
- O monstro vai cair em alguém que já foi monstro antes?
- Vai ter castigo do monstro esta semana?

### 💥 Polêmicas
- Alguém vai pedir para sair do programa?
- Vai ter punição por descumprir regras?

## Exemplos Práticos

### Exemplo 1: Big Fone (Improvável - 20%)
- **Pergunta:** "O Big Fone vai tocar essa semana?"
- **Probabilidade SIM:** 20%
- **Pontos base:** 5
- **Resultado:** SIM = 25pts | NÃO = 6pts

### Exemplo 2: Briga na Festa (Muito provável - 80%)
- **Pergunta:** "Vai ter briga na festa?"
- **Probabilidade SIM:** 80%
- **Pontos base:** 10
- **Resultado:** SIM = 12pts | NÃO = 50pts

### Exemplo 3: Incerto (50/50)
- **Pergunta:** "João vai para o paredão?"
- **Probabilidade SIM:** 50%
- **Pontos base:** 5
- **Resultado:** SIM = 10pts | NÃO = 10pts

## Recursos

### Interface do Admin
- ✅ Criar apostas com pergunta personalizada
- ✅ Definir odds diferentes para SIM e NÃO
- ✅ Preview em tempo real dos pontos calculados
- ✅ Fechar e pontuar com um clique
- ✅ Exibição clara das odds nas provas abertas

### Interface do Usuário
- ✅ Votação simples com botões grandes SIM/NÃO
- ✅ Visualização clara dos pontos possíveis
- ✅ Troca de voto antes do encerramento
- ✅ Feedback visual de acerto/erro após fechamento
- ✅ Animação de XP ao fazer primeira aposta

### Sistema Automático
- ✅ Pontuação automática via trigger SQL
- ✅ Incremento de acertos no perfil
- ✅ Arredondamento correto de pontos decimais
- ✅ Suporte a múltiplas apostas simultâneas

## Notas Técnicas

- As apostas binárias usam um UUID dummy (`00000000-0000-0000-0000-000000000000`) no campo `participante_id` pois não envolvem participantes
- A resposta é armazenada no campo `resposta_binaria` da tabela `apostas`
- O trigger `pontuar_apostas_binarias()` é executado automaticamente quando `fechada = TRUE`
- Os pontos são arredondados para inteiro mais próximo
