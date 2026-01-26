-- Script para dar pontos automaticamente quando paredão for fechado
-- Execute este SQL no Supabase SQL Editor
-- Este trigger será executado TODA VEZ que um paredão for fechado no Admin

-- Função para pontuar palpite de paredão
CREATE OR REPLACE FUNCTION pontuar_palpite_paredao()
RETURNS TRIGGER AS $$
DECLARE
  prova_palpite RECORD;
  aposta_record RECORD;
  pontos_por_acerto INTEGER := 10;
  eliminados_ids UUID[];
  total_pontos INTEGER;
  acertos_count INTEGER;
BEGIN
  -- Verificar se a prova fechada é um PAREDÃO
  IF NEW.fechada = TRUE AND OLD.fechada = FALSE AND NEW.tipo = 'paredao' THEN

    -- Buscar eliminados deste paredão (da tabela emparedados)
    SELECT ARRAY_AGG(participante_id) INTO eliminados_ids
    FROM emparedados
    WHERE prova_id = NEW.id;

    -- Se não houver emparedados, usar vencedor_id como fallback
    IF eliminados_ids IS NULL OR array_length(eliminados_ids, 1) IS NULL THEN
      IF NEW.vencedor_id IS NOT NULL THEN
        eliminados_ids := ARRAY[NEW.vencedor_id];
      ELSE
        RETURN NEW; -- Sem eliminados, não faz nada
      END IF;
    END IF;

    -- Buscar prova de palpite correspondente
    SELECT * INTO prova_palpite
    FROM provas
    WHERE tipo = 'palpite_paredao'
      AND data_prova <= NEW.data_prova
      AND arquivada = FALSE
      AND fechada = FALSE  -- Só pega palpites que ainda não foram fechados
    ORDER BY data_prova DESC
    LIMIT 1;

    -- Se encontrou um palpite
    IF prova_palpite.id IS NOT NULL THEN
      -- Iterar por cada usuário
      FOR aposta_record IN
        SELECT user_id, ARRAY_AGG(participante_id) as participantes_votados
        FROM apostas
        WHERE prova_id = prova_palpite.id
        GROUP BY user_id
      LOOP
        -- Contar acertos
        SELECT COUNT(*) INTO acertos_count
        FROM unnest(aposta_record.participantes_votados) AS votado
        WHERE votado = ANY(eliminados_ids);

        -- Se acertou
        IF acertos_count > 0 THEN
          total_pontos := acertos_count * pontos_por_acerto;

          -- Atualizar pontos das apostas
          UPDATE apostas
          SET pontos = pontos_por_acerto
          WHERE prova_id = prova_palpite.id
            AND user_id = aposta_record.user_id
            AND participante_id = ANY(eliminados_ids);

          -- Atualizar pontos totais do usuário
          UPDATE profiles
          SET pontos_totais = pontos_totais + total_pontos
          WHERE id = aposta_record.user_id;
        END IF;
      END LOOP;

      -- Marcar o palpite como fechado
      UPDATE provas
      SET fechada = TRUE,
          vencedor_id = NEW.vencedor_id
      WHERE id = prova_palpite.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar ou substituir o trigger
DROP TRIGGER IF EXISTS trigger_pontuar_palpite_paredao ON provas;
CREATE TRIGGER trigger_pontuar_palpite_paredao
  AFTER UPDATE ON provas
  FOR EACH ROW
  EXECUTE FUNCTION pontuar_palpite_paredao();

-- Comentário
COMMENT ON FUNCTION pontuar_palpite_paredao() IS 'Dá 10 pontos por eliminado certo no palpite quando paredão é fechado';

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Trigger instalado com sucesso!';
  RAISE NOTICE '';
  RAISE NOTICE '📌 Como funciona:';
  RAISE NOTICE '   1. Crie uma prova de "palpite_paredao" no Admin';
  RAISE NOTICE '   2. Usuários votam em até 3 participantes';
  RAISE NOTICE '   3. Crie uma prova de "paredão" com os emparedados';
  RAISE NOTICE '   4. Quando você FECHAR o paredão no Admin, os pontos';
  RAISE NOTICE '      serão calculados AUTOMATICAMENTE!';
  RAISE NOTICE '';
  RAISE NOTICE '💰 Pontuação: 10 pontos por cada eliminado certo';
  RAISE NOTICE '';
END $$;
