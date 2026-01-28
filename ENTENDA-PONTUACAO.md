# Como Funciona a Pontuação - Guia Completo

## 🎯 Lógica de Pontuação por Tipo de Prova

### 1. 🔥 Paredão / 🏃 Bate e Volta
**vencedor_id = Quem SAIU (foi eliminado)**

- Quando você fecha um paredão, seleciona quem foi **eliminado**
- Quem votou no eliminado **GANHA** pontos
- Quem votou em quem ficou **NÃO** ganha pontos

**Exemplo:**
```
Paredão: Diego, Vitória, Camila
Eliminada: Vitória

Admin fecha a prova e seleciona: "Vitória" como vencedor_id

Resultado:
✅ Quem votou em Vitória → +10 pontos
❌ Quem votou em Diego ou Camila → 0 pontos
```

---

### 2. 👑 Líder / 😇 Anjo / ⭐ Outras Provas
**vencedor_id = Quem GANHOU a prova**

- Quando você fecha líder/anjo, seleciona quem **venceu** a prova
- Quem votou no vencedor **GANHA** pontos
- Quem votou em outros **NÃO** ganha pontos

**Exemplo:**
```
Prova do Líder: Diego, Vitória, Camila
Vencedor: Diego

Admin fecha a prova e seleciona: "Diego" como vencedor_id

Resultado:
✅ Quem votou em Diego → +10 pontos
❌ Quem votou em Vitória ou Camila → 0 pontos
```

---

### 3. ❓ Apostas Binárias (Sim/Não)
**resposta_correta = 'sim' ou 'nao'**

- Quando você fecha uma aposta binária, seleciona SIM ou NÃO
- Quem votou na resposta correta **GANHA** pontos (calculado com odds)
- Quem votou errado **NÃO** ganha pontos

**Exemplo:**
```
Pergunta: "O Big Fone vai tocar esta semana?"
Pontos base: 5
Odds SIM: 2.0x (10 pontos)
Odds NÃO: 1.5x (7.5 ≈ 8 pontos)

Resposta real: NÃO tocou

Admin fecha e seleciona: "NÃO"

Resultado:
✅ Quem votou NÃO → +8 pontos
❌ Quem votou SIM → 0 pontos
```

---

### 4. 🎲 Palpite Paredão (múltipla escolha)
**Lógica especial: até 3 votos**

- Você vota em até 3 pessoas que acha que vão sair
- Cada acerto vale 10 pontos
- Pode acertar 0, 1, 2 ou 3

**Exemplo:**
```
Paredão: Diego, Vitória, Camila, Matheus, Brígido
Você votou em: Diego, Vitória, Brígido

Saíram: Vitória e Brígido (paredão duplo)

Resultado:
✅ Acertou 2 eliminados → +20 pontos (2 × 10)
```

---

## 🔧 Como Executar a Correção

Se a pontuação está errada (ex: votou em quem saiu mas não ganhou pontos):

### 1. Executar script de correção

Copie e cole no **Supabase SQL Editor**:

`FIX-PONTUACAO-PROVAS.sql`

Este script:
- ✅ Remove trigger antigo (se tiver)
- ✅ Cria trigger novo com lógica correta
- ✅ Diferencia paredão de outras provas
- ✅ Mantém palpite paredão funcionando

### 2. Reabrir e fechar prova novamente (se já fechou errado)

Se você já fechou uma prova e os pontos foram dados errado:

**Opção A: Reabrir e fechar de novo (mais fácil)**
```sql
-- 1. Zerar pontos da prova
UPDATE apostas SET pontos = 0 WHERE prova_id = '[ID-DA-PROVA]';

-- 2. Reabrir prova
UPDATE provas SET fechada = FALSE WHERE id = '[ID-DA-PROVA]';

-- 3. Agora feche pelo Admin novamente
-- O trigger correto vai pontuar certinho
```

**Opção B: Corrigir manualmente**
```sql
-- Ver quem votou em quem
SELECT
  p.username,
  part.nome,
  a.pontos
FROM apostas a
JOIN profiles p ON a.user_id = p.id
JOIN participantes part ON a.participante_id = part.id
WHERE a.prova_id = '[ID-DA-PROVA]'
ORDER BY p.username;

-- Se precisar adicionar/remover pontos manualmente:
UPDATE profiles
SET pontos_totais = pontos_totais + 10
WHERE id = '[USER-ID]';
```

---

## 📊 Valores de Pontos

| Tipo de Prova | Pontos por Acerto |
|---------------|-------------------|
| Paredão (votou em quem saiu) | 10 pontos |
| Líder (votou no vencedor) | 10 pontos |
| Anjo (votou no vencedor) | 10 pontos |
| Bate e Volta (votou em quem saiu) | 10 pontos |
| Prova Customizada | 10 pontos |
| Palpite Paredão | 10 pontos **por acerto** (até 30) |
| Aposta Binária | `pontos_base × odds` |

---

## ❓ FAQ

### Fechei o paredão errado, como corrigir?

1. Execute o `FIX-PONTUACAO-PROVAS.sql` primeiro
2. Reabra a prova:
   ```sql
   UPDATE apostas SET pontos = 0 WHERE prova_id = '[ID]';
   UPDATE provas SET fechada = FALSE WHERE id = '[ID]';
   ```
3. Feche novamente pelo Admin, selecionando quem saiu

### Por que não ganhou pontos mesmo votando certo?

Verifique:
1. Trigger está instalado? Execute `FIX-PONTUACAO-PROVAS.sql`
2. Você votou **antes** da prova fechar?
3. Para **paredão**: selecionou quem **saiu** (não quem ficou)?
4. Para **líder**: selecionou quem **ganhou** (não quem perdeu)?

### Como ver os logs de pontuação?

No Supabase SQL Editor, após fechar uma prova, você verá mensagens como:
```
NOTICE: Paredão/Bate-volta pontuado: 5 usuários ganharam 10 pontos cada (votaram em quem saiu)
NOTICE: Prova lider pontuada: 3 usuários ganharam 10 pontos cada (votaram no vencedor)
```

---

## 🎮 Resumo Rápido

**PAREDÃO = Selecione quem SAIU**
Quem votou no eliminado ganha pontos ✅

**LÍDER = Selecione quem GANHOU**
Quem votou no vencedor ganha pontos ✅

**BINÁRIA = Selecione a resposta correta**
Quem votou certo ganha pontos × odds ✅

**PALPITE = Automático quando paredão fecha**
Cada acerto = 10 pontos (até 3 acertos) ✅
