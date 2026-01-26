-- ============================================================================
-- CONFIGURAR NOTIFICAÇÕES POR EMAIL QUANDO ALGUÉM FAZ UMA APOSTA
-- ============================================================================
-- Este script cria um webhook que dispara uma Edge Function do Supabase
-- sempre que uma nova aposta é inserida na tabela 'apostas'
-- ============================================================================

-- PASSO 1: No Supabase Dashboard, vá em "Database" > "Webhooks"
-- PASSO 2: Clique em "Create a new hook"
-- PASSO 3: Preencha os campos:
--   - Name: notify_new_bet
--   - Table: apostas
--   - Events: INSERT (marque apenas INSERT)
--   - Type: HTTP Request
--   - Method: POST
--   - URL: https://[SEU-PROJECT-ID].supabase.co/functions/v1/notify-new-bet
--   - HTTP Headers:
--       Authorization: Bearer [SUA-ANON-KEY]
--       Content-Type: application/json

-- ============================================================================
-- ALTERNATIVA: Usar trigger SQL para enviar notificação
-- ============================================================================
-- Se preferir usar um trigger SQL ao invés de webhook HTTP:

-- 1. Criar uma função que será chamada pelo trigger
CREATE OR REPLACE FUNCTION notify_new_bet_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Chamar a Edge Function via pg_net (extensão HTTP do Postgres)
  PERFORM
    net.http_post(
      url := 'https://' || current_setting('app.settings.project_ref') || '.supabase.co/functions/v1/notify-new-bet',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.anon_key')
      ),
      body := jsonb_build_object(
        'type', 'INSERT',
        'table', 'apostas',
        'record', row_to_json(NEW)
      )
    );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Criar o trigger
DROP TRIGGER IF EXISTS on_new_bet_notify ON apostas;
CREATE TRIGGER on_new_bet_notify
  AFTER INSERT ON apostas
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_bet_trigger();

-- ============================================================================
-- IMPORTANTE: Configurações necessárias
-- ============================================================================

-- 1. Habilitar a extensão pg_net se ainda não estiver habilitada:
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Configurar as variáveis de ambiente (execute via dashboard ou SQL):
-- ALTER DATABASE postgres SET "app.settings.project_ref" TO '[SEU-PROJECT-ID]';
-- ALTER DATABASE postgres SET "app.settings.anon_key" TO '[SUA-ANON-KEY]';

-- ============================================================================
-- DEPLOY DA EDGE FUNCTION
-- ============================================================================

-- No terminal, execute:
-- 1. Instalar Supabase CLI: npm install -g supabase
-- 2. Login: supabase login
-- 3. Link ao projeto: supabase link --project-ref [SEU-PROJECT-ID]
-- 4. Deploy da função: supabase functions deploy notify-new-bet

-- ============================================================================
-- TESTAR A NOTIFICAÇÃO
-- ============================================================================

-- Fazer uma aposta de teste para verificar se o email é enviado:
-- INSERT INTO apostas (user_id, prova_id, participante_id)
-- VALUES ('[SEU-USER-ID]', '[UMA-PROVA-ID]', '[UM-PARTICIPANTE-ID]');

-- Verificar logs da Edge Function no Supabase Dashboard em:
-- Functions > notify-new-bet > Logs

SELECT '✅ Configuração preparada! Siga os passos acima para ativar.' AS status;
