# Sistema de Comentários e Notificações

## 1. Execute o SQL Corrigido

Execute o arquivo `ADICIONAR-COMENTARIOS-CORRIGIDO.sql` no Supabase SQL Editor.

Este SQL cria:
- ✅ Tabela `comentarios_apostas` para comentários
- ✅ Tabela `notificacoes` para notificações
- ✅ Políticas RLS (Row Level Security) para segurança
- ✅ Triggers automáticos para criar notificações quando alguém comenta ou reage

## 2. Componentes Criados

### ComentariosReacoes (`src/components/ComentariosReacoes.tsx`)
Componente que adiciona comentários e reações a qualquer aposta.

**Recursos:**
- ✅ 5 tipos de reações: 👍 🔥 🤔 💀 🤡
- ✅ Input de comentário com "Deixe um comentário ou uma reação"
- ✅ Lista de comentários com avatar e timestamp
- ✅ Botões de emoji para reagir rapidamente
- ✅ Animações suaves

### Notificacoes (`src/components/Notificacoes.tsx`)
Componente de sino de notificações na navbar.

**Recursos:**
- ✅ Badge vermelho com contador de não lidas
- ✅ Animação de pulse quando tem notificações
- ✅ Dropdown com lista de notificações
- ✅ Tempo real usando Supabase Realtime
- ✅ Marcar individual ou todas como lidas
- ✅ Ícone diferente para comentário (💬) e reação (❤️)

## 3. Como Usar

### Adicionar comentários/reações em uma página

Exemplo na página Amigos ou Feed:

```tsx
import ComentariosReacoes from '../components/ComentariosReacoes';

// Dentro do componente onde você renderiza apostas
<ComentariosReacoes
  apostaId={aposta.id}
  reacoes={reacoesPorAposta[aposta.id] || []}
  onReacaoChange={() => carregarApostas()} // Recarrega após reagir
/>
```

### Carregar reações agrupadas

```tsx
// Carregar reações agrupadas por aposta
const { data: reacoesData } = await supabase
  .from('reacoes_votos')
  .select('aposta_id, tipo, user_id');

// Agrupar por aposta
const reacoesPorAposta: Record<string, Array<{ tipo: string; count: number; usuarios: string[] }>> = {};

reacoesData?.forEach(r => {
  if (!reacoesPorAposta[r.aposta_id]) {
    reacoesPorAposta[r.aposta_id] = [];
  }

  const existing = reacoesPorAposta[r.aposta_id].find(x => x.tipo === r.tipo);
  if (existing) {
    existing.count++;
    existing.usuarios.push(r.user_id);
  } else {
    reacoesPorAposta[r.aposta_id].push({
      tipo: r.tipo,
      count: 1,
      usuarios: [r.user_id]
    });
  }
});
```

## 4. Fluxo de Notificações

1. **Usuário A** comenta ou reage na aposta de **Usuário B**
2. Trigger SQL cria automaticamente uma notificação para **Usuário B**
3. Componente de notificações detecta via Realtime
4. Badge vermelho aparece com contador
5. **Usuário B** clica no sino e vê a notificação
6. Ao clicar na notificação, ela é marcada como lida

## 5. Segurança (RLS)

- ✅ Usuários só podem ver suas próprias notificações
- ✅ Usuários podem comentar em qualquer aposta
- ✅ Usuários só podem deletar seus próprios comentários
- ✅ Notificações são criadas automaticamente via trigger seguro

## 6. Próximos Passos (Opcional)

Para integrar completamente:

1. Adicione `ComentariosReacoes` na página **Amigos** (`src/pages/Amigos.tsx`)
2. Adicione na página **Feed** (`src/pages/Feed.tsx`)
3. Personalize os emojis de reação se desejar
4. Adicione link na notificação para ir direto à aposta comentada
