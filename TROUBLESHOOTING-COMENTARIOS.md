# Troubleshooting - Sistema de Comentários e Notificações

## Erro: "Erro ao enviar comentário"

### Causa Provável
A tabela `comentarios_feed` não existe no banco de dados.

### Solução

1. **Abra o Supabase Dashboard**
   - Acesse: https://supabase.com/dashboard
   - Entre no seu projeto

2. **Execute o SQL**
   - Vá em: **SQL Editor** (menu lateral)
   - Abra o arquivo `ADICIONAR-COMENTARIOS-CORRIGIDO.sql`
   - Copie todo o conteúdo
   - Cole no SQL Editor
   - Clique em **Run** ou **Execute**

3. **Verifique as Tabelas Criadas**
   Após executar, as seguintes tabelas devem existir:
   - ✅ `comentarios_apostas`
   - ✅ `comentarios_feed` ← **Esta é necessária para comentários no Feed**
   - ✅ `notificacoes`

4. **Teste Novamente**
   - Recarregue a página
   - Tente comentar em uma atividade do Feed
   - Deve funcionar agora!

---

## Verificação das Tabelas

Execute este SQL para verificar se as tabelas foram criadas:

```sql
-- Verificar tabelas
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('comentarios_feed', 'comentarios_apostas', 'notificacoes');
```

Deve retornar 3 linhas.

---

## Verificação das Políticas RLS

Execute para verificar as políticas:

```sql
-- Verificar políticas RLS
SELECT tablename, policyname
FROM pg_policies
WHERE tablename IN ('comentarios_feed', 'comentarios_apostas', 'notificacoes');
```

Deve retornar várias políticas.

---

## Verificação dos Triggers

Execute para verificar os triggers:

```sql
-- Verificar triggers
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_name IN ('trigger_notificacao_comentario_feed', 'trigger_notificacao_comentario', 'trigger_notificacao_reacao');
```

---

## Erros Comuns

### 1. "relation 'comentarios_feed' does not exist"
**Solução:** Execute o SQL `ADICIONAR-COMENTARIOS-CORRIGIDO.sql`

### 2. "permission denied for table comentarios_feed"
**Solução:** As políticas RLS não foram criadas. Execute o SQL completo novamente.

### 3. "new row violates row-level security policy"
**Solução:** Verifique se `auth.uid()` está funcionando. Faça logout e login novamente.

### 4. Notificações não aparecem
**Solução:** Verifique se os triggers foram criados executando o SQL de verificação acima.

---

## Recursos do Sistema

### ✅ Implementado

1. **Comentários no Feed**
   - Tabela: `comentarios_feed`
   - Componente: `FeedItem.tsx`
   - Trigger de notificação automática

2. **Notificações**
   - Tabela: `notificacoes`
   - Componente: `Notificacoes.tsx`
   - Real-time com Supabase Realtime
   - Badge com contador
   - Dropdown animado

3. **Reações em Amigos**
   - Emojis sempre visíveis
   - Ordenação inteligente (suas reações primeiro)
   - Destaque visual para reações ativas

### 🚧 Tabelas Disponíveis mas Não Utilizadas

- `comentarios_apostas`: Para comentários em apostas específicas (não implementado no frontend)

---

## Contato

Se o problema persistir após executar o SQL:
1. Verifique o console do navegador (F12 → Console)
2. Copie o erro completo
3. Verifique se você está logado corretamente
