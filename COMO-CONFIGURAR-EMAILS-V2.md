# Como Configurar Notificações por Email (V2)

## Tipos de Notificações

O sistema envia emails em **2 situações**:

1. **Nova Prova Criada** 🎯
   - Quando: Admin cria uma nova prova
   - Quem recebe: TODOS os usuários cadastrados
   - Conteúdo: Informações da prova, data, pontos possíveis

2. **Pontos Ganhos** 🎉
   - Quando: Prova é fechada e pontos são distribuídos
   - Quem recebe: Apenas quem GANHOU pontos
   - Conteúdo: Quantos pontos ganhou, resposta correta

**NÃO envia mais email quando alguém vota!**

---

## Configuração Rápida (Webhooks)

### Passo 1: Deploy das Edge Functions

```bash
# Fazer login no Supabase
supabase login

# Link ao projeto
supabase link --project-ref [SEU-PROJECT-ID]

# Deploy das 2 funções
supabase functions deploy notify-new-prova
supabase functions deploy notify-points-awarded
```

### Passo 2: Configurar Webhooks no Dashboard

#### Webhook 1: Nova Prova

1. Dashboard > **Database** > **Webhooks** > **Create a new hook**
2. Preencha:
   - **Name:** `notify_new_prova`
   - **Table:** `provas`
   - **Events:** Marque apenas **INSERT**
   - **Type:** HTTP Request
   - **Method:** POST
   - **URL:** `https://[PROJECT-ID].supabase.co/functions/v1/notify-new-prova`
   - **HTTP Headers:**
     ```
     Authorization: Bearer [SUA-ANON-KEY]
     Content-Type: application/json
     ```

#### Webhook 2: Pontos Ganhos

1. Dashboard > **Database** > **Webhooks** > **Create a new hook**
2. Preencha:
   - **Name:** `notify_points_awarded`
   - **Table:** `provas`
   - **Events:** Marque apenas **UPDATE**
   - **Type:** HTTP Request
   - **Method:** POST
   - **URL:** `https://[PROJECT-ID].supabase.co/functions/v1/notify-points-awarded`
   - **HTTP Headers:**
     ```
     Authorization: Bearer [SUA-ANON-KEY]
     Content-Type: application/json
     ```

### Passo 3: Remover Webhook Antigo (se existir)

Se você configurou o webhook `notify_new_bet` anteriormente:
- Dashboard > Database > Webhooks
- Encontre `notify_new_bet`
- Clique em **Delete**

---

## Alternativa: Usando Triggers SQL

Execute o script `SETUP-EMAIL-NOTIFICATIONS-V2.sql` no SQL Editor do Supabase.

Antes, configure as variáveis:

```sql
ALTER DATABASE postgres SET "app.settings.project_ref" TO 'seu-project-id';
ALTER DATABASE postgres SET "app.settings.anon_key" TO 'sua-anon-key';
```

---

## Exemplos de Emails

### 1. Email de Nova Prova

**Assunto:** 🔥 Nova Prova: Paredão

**Conteúdo:**
- Ícone grande da prova
- Nome/descrição da prova
- Data
- Pontos possíveis (se for aposta binária: SIM = X pts, NÃO = Y pts)
- Botão "Fazer minha aposta agora"

### 2. Email de Pontos Ganhos

**Assunto:** 🎉 Você ganhou 25 pontos!

**Conteúdo:**
- Parabéns com confetes
- Qual prova você acertou
- Resposta correta
- Quantos pontos ganhou (grande e destacado)
- Botão "Ver Ranking"

---

## Testar as Notificações

### Teste 1: Nova Prova
1. Crie uma prova pelo painel Admin
2. Verifique se todos os usuários receberam email
3. Checar logs: Dashboard > Functions > notify-new-prova > Logs

### Teste 2: Pontos Ganhos
1. Crie uma prova de teste
2. Faça apostas com diferentes usuários
3. Feche a prova e defina o vencedor
4. Apenas quem acertou deve receber email
5. Checar logs: Dashboard > Functions > notify-points-awarded > Logs

---

## Troubleshooting

### Emails não estão sendo enviados

1. **Verificar deploy:**
   ```bash
   supabase functions list
   ```
   Deve mostrar `notify-new-prova` e `notify-points-awarded`

2. **Verificar webhooks:**
   - Dashboard > Database > Webhooks
   - Verificar se estão marcados como "enabled"

3. **Verificar logs:**
   - Dashboard > Functions > [nome da função] > Logs
   - Procurar por erros

### Usuários não têm email

Por padrão, pega o email de `auth.users`. Verificar:
1. Usuários fizeram cadastro com email?
2. Email está confirmado?
3. Query: `SELECT id, email FROM auth.users;`

### Email vai para spam

Para evitar que emails vão para spam:
1. Configure SPF/DKIM no Supabase (se disponível)
2. Peça aos usuários para adicionar `no-reply@[project-ref].supabase.co` aos contatos
3. Em produção, considere usar serviço dedicado (SendGrid, Mailgun, etc.)

---

## Customização

### Mudar template de email

Edite os arquivos:
- `supabase/functions/notify-new-prova/index.ts` (linha 80+)
- `supabase/functions/notify-points-awarded/index.ts` (linha 115+)

Depois, faça redeploy:
```bash
supabase functions deploy notify-new-prova
supabase functions deploy notify-points-awarded
```

### Mudar URL do botão

Configure variável de ambiente `SITE_URL`:
- Dashboard > Edge Functions > [função] > Settings > Environment Variables
- Adicione: `SITE_URL` = `https://seu-dominio.com`

Ou edite diretamente no código (linhas com `Deno.env.get('SITE_URL')`).

### Desabilitar temporariamente

**Webhooks:**
- Dashboard > Database > Webhooks > Desmarcar "enabled"

**Triggers SQL:**
```sql
-- Desabilitar
ALTER TABLE provas DISABLE TRIGGER on_new_prova_notify;
ALTER TABLE provas DISABLE TRIGGER on_points_awarded_notify;

-- Reabilitar
ALTER TABLE provas ENABLE TRIGGER on_new_prova_notify;
ALTER TABLE provas ENABLE TRIGGER on_points_awarded_notify;
```

---

## Arquivos Antigos

Se você usou a versão anterior (V1), pode deletar:
- ❌ `supabase/functions/notify-new-bet/index.ts`
- ❌ `SETUP-EMAIL-NOTIFICATIONS.sql` (antigo)

Use:
- ✅ `supabase/functions/notify-new-prova/index.ts`
- ✅ `supabase/functions/notify-points-awarded/index.ts`
- ✅ `SETUP-EMAIL-NOTIFICATIONS-V2.sql`
