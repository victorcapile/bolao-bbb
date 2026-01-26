# Como Configurar Notificações por Email

## Opção 1: Usando Webhooks do Supabase (Mais Simples)

### Passo 1: Deploy da Edge Function

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login no Supabase
supabase login

# Link ao seu projeto
supabase link --project-ref [SEU-PROJECT-ID]

# Deploy da função
supabase functions deploy notify-new-bet
```

### Passo 2: Configurar Webhook no Dashboard

1. Acesse o Supabase Dashboard
2. Vá em **Database** > **Webhooks**
3. Clique em **Create a new hook**
4. Preencha:
   - **Name:** `notify_new_bet`
   - **Table:** `apostas`
   - **Events:** Marque apenas **INSERT**
   - **Type:** HTTP Request
   - **Method:** POST
   - **URL:** `https://[SEU-PROJECT-ID].supabase.co/functions/v1/notify-new-bet`
   - **HTTP Headers:**
     ```
     Authorization: Bearer [SUA-ANON-KEY]
     Content-Type: application/json
     ```

### Passo 3: Configurar URL do Site (Opcional)

No arquivo `supabase/functions/notify-new-bet/index.ts`, linha 91, substitua:
```typescript
Deno.env.get('SITE_URL') || 'https://bolao-bbb.vercel.app'
```

Por sua URL real (ou configure SITE_URL nas variáveis de ambiente da Edge Function).

---

## Opção 2: Usando Trigger SQL (Alternativa)

### Execute o script SQL

Copie e cole o conteúdo de `SETUP-EMAIL-NOTIFICATIONS.sql` no SQL Editor do Supabase.

Antes de executar, você precisa configurar:

```sql
-- Substituir [SEU-PROJECT-ID] pelo ID do seu projeto
ALTER DATABASE postgres SET "app.settings.project_ref" TO 'seu-project-id';

-- Substituir [SUA-ANON-KEY] pela sua chave anônima
ALTER DATABASE postgres SET "app.settings.anon_key" TO 'sua-anon-key';
```

Depois execute o script completo.

---

## Como Funciona

Quando alguém faz uma aposta:
1. Um trigger SQL ou Webhook detecta a nova aposta
2. A Edge Function `notify-new-bet` é chamada
3. A função busca:
   - Informações do usuário que fez a aposta
   - Informações da prova
   - Informações do participante/resposta binária
4. Envia email para **todos os outros usuários cadastrados**
5. Email contém:
   - Quem fez a aposta
   - Em qual prova
   - Em quem/o que votou
   - Link para fazer a própria aposta

---

## Testar a Notificação

Após configurar, faça uma aposta no app e verifique:

1. **Logs da Edge Function:**
   - Dashboard > Functions > notify-new-bet > Logs

2. **Verificar emails enviados:**
   - Confira sua caixa de entrada
   - Verifique também spam/lixo eletrônico

---

## Troubleshooting

### Emails não estão sendo enviados

1. **Verificar logs:** Dashboard > Functions > notify-new-bet > Logs
2. **Verificar webhook:** Dashboard > Database > Webhooks (ver se está ativo)
3. **Verificar trigger:** Execute `SELECT * FROM pg_trigger WHERE tgname = 'on_new_bet_notify';`

### Edge Function não está sendo chamada

1. Verificar se o webhook está configurado corretamente
2. Verificar URL da Edge Function
3. Verificar se a função foi deployada: `supabase functions list`

### Usuários não têm email cadastrado

Por padrão, o Supabase pega o email do `auth.users`. Se o email não estiver lá:
1. Verificar se usuários estão fazendo login/cadastro com email
2. Adicionar campo `email` na tabela `profiles` se necessário

---

## Customização

### Mudar template do email

Edite o arquivo `supabase/functions/notify-new-bet/index.ts` na seção do HTML (linha 75+).

### Mudar destinatários

Por padrão, todos os usuários EXCETO quem fez a aposta recebem email.

Para mudar (ex: apenas amigos):
```typescript
// Linha 64 - substituir por:
const { data: users } = await supabaseClient
  .from('amizades')
  .select('profiles!amizades_amigo_id_fkey(email, username)')
  .eq('user_id', record.user_id)
```

### Desabilitar temporariamente

**Webhook:** Dashboard > Database > Webhooks > Desmarcar "enabled"

**Trigger SQL:**
```sql
ALTER TABLE apostas DISABLE TRIGGER on_new_bet_notify;

-- Para reativar:
ALTER TABLE apostas ENABLE TRIGGER on_new_bet_notify;
```
