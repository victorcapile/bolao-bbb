-- ============================================================================
-- CONFIGURAR NOTIFICAÇÕES POR EMAIL (V2 - Simplificado)
-- ============================================================================
-- Este script configura 2 tipos de notificações:
-- 1. Quando uma NOVA PROVA é criada → todos recebem email
-- 2. Quando usuários GANHAM PONTOS → só quem ganhou recebe email
--
-- NÃO envia email quando alguém vota (removido)
-- ============================================================================

-- ============================================================================
-- OPÇÃO 1: Usando Webhooks (RECOMENDADO - Mais Fácil)
-- ============================================================================

-- No Supabase Dashboard:
--
-- 1. Webhook para NOVA PROVA:
--    Database > Webhooks > Create a new hook
--    - Name: notify_new_prova
--    - Table: provas
--    - Events: INSERT (apenas INSERT)
--    - Method: POST
--    - URL: https://[PROJECT-ID].supabase.co/functions/v1/notify-new-prova
--    - Headers:
--        Authorization: Bearer [ANON-KEY]
--        Content-Type: application/json
--
-- 2. Webhook para PONTOS GANHOS:
--    Database > Webhooks > Create a new hook
--    - Name: notify_points_awarded
--    - Table: provas
--    - Events: UPDATE (apenas UPDATE)
--    - Method: POST
--    - URL: https://[PROJECT-ID].supabase.co/functions/v1/notify-points-awarded
--    - Headers:
--        Authorization: Bearer [ANON-KEY]
--        Content-Type: application/json

-- ============================================================================
-- OPÇÃO 2: Usando Triggers SQL (Alternativa)
-- ============================================================================

-- Habilitar extensão pg_net
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 1. TRIGGER: Notificar quando NOVA PROVA é criada
CREATE OR REPLACE FUNCTION notify_new_prova_trigger()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM
    net.http_post(
      url := 'https://' || current_setting('app.settings.project_ref') || '.supabase.co/functions/v1/notify-new-prova',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.anon_key')
      ),
      body := jsonb_build_object(
        'type', 'INSERT',
        'table', 'provas',
        'record', row_to_json(NEW)
      )
    );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_prova_notify ON provas;
CREATE TRIGGER on_new_prova_notify
  AFTER INSERT ON provas
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_prova_trigger();

-- 2. TRIGGER: Notificar quando PROVA É FECHADA (usuários ganham pontos)
CREATE OR REPLACE FUNCTION notify_points_awarded_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Só dispara se a prova foi FECHADA agora (old.fechada = false, new.fechada = true)
  IF NEW.fechada = TRUE AND OLD.fechada = FALSE THEN
    PERFORM
      net.http_post(
        url := 'https://' || current_setting('app.settings.project_ref') || '.supabase.co/functions/v1/notify-points-awarded',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.anon_key')
        ),
        body := jsonb_build_object(
          'type', 'UPDATE',
          'table', 'provas',
          'record', row_to_json(NEW),
          'old_record', jsonb_build_object('fechada', OLD.fechada)
        )
      );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_points_awarded_notify ON provas;
CREATE TRIGGER on_points_awarded_notify
  AFTER UPDATE ON provas
  FOR EACH ROW
  EXECUTE FUNCTION notify_points_awarded_trigger();

-- ============================================================================
-- REMOVER TRIGGER ANTIGO (de apostas)
-- ============================================================================

-- Remover trigger que notificava a cada voto
DROP TRIGGER IF EXISTS on_new_bet_notify ON apostas;
DROP FUNCTION IF EXISTS notify_new_bet_trigger();

-- ============================================================================
-- CONFIGURAR VARIÁVEIS (necessário para triggers SQL)
-- ============================================================================

-- Substituir pelos seus valores:
-- ALTER DATABASE postgres SET "app.settings.project_ref" TO 'seu-project-id';
-- ALTER DATABASE postgres SET "app.settings.anon_key" TO 'sua-anon-key';

-- ============================================================================
-- DEPLOY DAS EDGE FUNCTIONS
-- ============================================================================

-- No terminal:
-- supabase functions deploy notify-new-prova
-- supabase functions deploy notify-points-awarded

-- ============================================================================
-- TESTAR AS NOTIFICAÇÕES
-- ============================================================================

-- Teste 1: Criar nova prova (todos devem receber email)
-- INSERT INTO provas (tipo, descricao, data_prova, fechada, arquivada)
-- VALUES ('lider', 'Teste de Notificação', NOW(), false, false);

-- Teste 2: Fechar uma prova (apenas vencedores recebem email)
-- Primeiro, faça apostas de teste
-- Depois, feche a prova:
-- UPDATE provas SET fechada = TRUE, vencedor_id = '[UUID-VENCEDOR]' WHERE id = '[UUID-PROVA]';

SELECT '✅ Configuração V2 preparada! Agora apenas 2 tipos de email serão enviados.' AS status;
