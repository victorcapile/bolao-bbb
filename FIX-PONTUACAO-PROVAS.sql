-- ============================================================================
-- CORRIGIR LÓGICA DE PONTUAÇÃO PARA TODAS AS PROVAS
-- ============================================================================
-- Este script cria um trigger unificado que pontua TODAS as provas corretamente:
--
-- PAREDÃO/BATE_VOLTA: vencedor_id = quem SAIU (eliminado)
--   → Quem votou no eliminado GANHA pontos
--
-- LÍDER/ANJO/OUTRAS: vencedor_id = quem GANHOU a prova
--   → Quem votou no vencedor GANHA pontos
--
-- APOSTA BINÁRIA: resposta_correta = 'sim' ou 'nao'
--   → Quem votou na resposta correta GANHA pontos
--
-- PALPITE PAREDÃO: já tem trigger próprio (PONTUAR-PALPITE-PAREDAO.sql)
-- ============================================================================

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS trigger_pontuar_provas ON provas;
DROP FUNCTION IF EXISTS pontuar_provas();

-- Criar função unificada de pontuação
CREATE OR REPLACE FUNCTION pontuar_provas()
RETURNS TRIGGER AS $$
DECLARE
  aposta_record RECORD;
  pontos_ganhos INTEGER := 10; -- Pontos padrão
  total_pontuados INTEGER := 0;
BEGIN
  -- Só executa se a prova foi FECHADA agora (transição de false → true)
  IF NEW.fechada = TRUE AND OLD.fechada = FALSE THEN

    -- ========================================================================
    -- CASO 1: APOSTA BINÁRIA (Sim/Não)
    -- ========================================================================
    IF NEW.is_aposta_binaria = TRUE AND NEW.resposta_correta IS NOT NULL THEN
      -- Calcular pontos com base nas odds
      IF NEW.resposta_correta = 'sim' THEN
        pontos_ganhos := ROUND(NEW.pontos_base * NEW.odds_sim);
      ELSE
        pontos_ganhos := ROUND(NEW.pontos_base * NEW.odds_nao);
      END IF;

      -- Pontuar quem acertou
      FOR aposta_record IN
        SELECT user_id, id
        FROM apostas
        WHERE prova_id = NEW.id
          AND resposta_binaria = NEW.resposta_correta
      LOOP
        total_pontuados := total_pontuados + 1;

        -- Atualizar pontos da aposta
        UPDATE apostas
        SET pontos = pontos_ganhos
        WHERE id = aposta_record.id;

        -- Atualizar pontos totais do usuário
        UPDATE profiles
        SET pontos_totais = pontos_totais + pontos_ganhos
        WHERE id = aposta_record.user_id;
      END LOOP;

      RAISE NOTICE 'Aposta binária pontuada: % usuários ganharam % pontos cada',
        total_pontuados, pontos_ganhos;

    -- ========================================================================
    -- CASO 2: PALPITE PAREDÃO (tem trigger próprio, pular)
    -- ========================================================================
    ELSIF NEW.tipo = 'palpite_paredao' THEN
      -- Não fazer nada, o trigger pontuar_palpite_paredao() cuida disso
      RAISE NOTICE 'Palpite paredão - trigger próprio executará';

    -- ========================================================================
    -- CASO 3: PAREDÃO ou BATE_VOLTA (quem SAIU)
    -- ========================================================================
    ELSIF (NEW.tipo = 'paredao' OR NEW.tipo = 'bate_volta') AND NEW.vencedor_id IS NOT NULL THEN
      -- Para paredão/bate_volta: vencedor_id = quem SAIU
      -- Quem votou no eliminado GANHA pontos

      FOR aposta_record IN
        SELECT user_id, id
        FROM apostas
        WHERE prova_id = NEW.id
          AND participante_id = NEW.vencedor_id -- Votou em quem saiu
      LOOP
        total_pontuados := total_pontuados + 1;

        -- Atualizar pontos da aposta
        UPDATE apostas
        SET pontos = pontos_ganhos
        WHERE id = aposta_record.id;

        -- Atualizar pontos totais do usuário
        UPDATE profiles
        SET pontos_totais = pontos_totais + pontos_ganhos
        WHERE id = aposta_record.user_id;
      END LOOP;

      RAISE NOTICE 'Paredão/Bate-volta pontuado: % usuários ganharam % pontos cada (votaram em quem saiu)',
        total_pontuados, pontos_ganhos;

    -- ========================================================================
    -- CASO 4: OUTRAS PROVAS (Líder, Anjo, Customizadas)
    -- ========================================================================
    ELSIF NEW.vencedor_id IS NOT NULL THEN
      -- Para líder/anjo/outras: vencedor_id = quem GANHOU a prova
      -- Quem votou no vencedor GANHA pontos

      FOR aposta_record IN
        SELECT user_id, id
        FROM apostas
        WHERE prova_id = NEW.id
          AND participante_id = NEW.vencedor_id -- Votou no vencedor
      LOOP
        total_pontuados := total_pontuados + 1;

        -- Atualizar pontos da aposta
        UPDATE apostas
        SET pontos = pontos_ganhos
        WHERE id = aposta_record.id;

        -- Atualizar pontos totais do usuário
        UPDATE profiles
        SET pontos_totais = pontos_totais + pontos_ganhos
        WHERE id = aposta_record.user_id;
      END LOOP;

      RAISE NOTICE 'Prova % pontuada: % usuários ganharam % pontos cada (votaram no vencedor)',
        NEW.tipo, total_pontuados, pontos_ganhos;

    ELSE
      RAISE NOTICE 'Prova fechada mas sem vencedor/resposta definido(a). ID: %', NEW.id;
    END IF;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger
CREATE TRIGGER trigger_pontuar_provas
  AFTER UPDATE ON provas
  FOR EACH ROW
  EXECUTE FUNCTION pontuar_provas();

-- Comentário
COMMENT ON FUNCTION pontuar_provas() IS
'Pontua todas as provas quando fechadas:
- Paredão/Bate-volta: quem votou em quem SAIU ganha
- Líder/Anjo: quem votou em quem GANHOU ganha
- Binária: quem votou na resposta correta ganha
- Palpite Paredão: trigger próprio';

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================

-- Ver triggers ativos
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'provas'
  AND trigger_schema = 'public'
ORDER BY trigger_name;

SELECT '✅ Trigger de pontuação unificado criado com sucesso!' AS status;
SELECT '⚠️ IMPORTANTE: A lógica agora é:' AS aviso;
SELECT '   • PAREDÃO/BATE-VOLTA: vencedor_id = quem SAIU (eliminado)' AS info1;
SELECT '   • LÍDER/ANJO/OUTRAS: vencedor_id = quem GANHOU a prova' AS info2;
SELECT '   • APOSTA BINÁRIA: resposta_correta = sim ou nao' AS info3;
