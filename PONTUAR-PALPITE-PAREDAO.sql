-- Script para dar pontos aos usuários que acertaram o palpite do paredão
-- Execute este SQL no Supabase SQL Editor

-- Função para pontuar palpite de paredão quando uma prova é fechada
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
  -- Verificar se a prova que foi fechada é um PAREDÃO (não palpite)
  IF NEW.fechada = TRUE AND OLD.fechada = FALSE AND NEW.tipo = 'paredao' THEN

    -- Buscar todos os eliminados deste paredão (emparedados da prova)
    SELECT ARRAY_AGG(participante_id) INTO eliminados_ids
    FROM emparedados
    WHERE prova_id = NEW.id;

    -- Se não houver eliminados registrados, usar o vencedor_id como fallback
    IF eliminados_ids IS NULL OR array_length(eliminados_ids, 1) IS NULL THEN
      IF NEW.vencedor_id IS NOT NULL THEN
        eliminados_ids := ARRAY[NEW.vencedor_id];
      ELSE
        RETURN NEW; -- Sem eliminados, retorna sem fazer nada
      END IF;
    END IF;

    -- Buscar a prova de palpite_paredao correspondente (mais recente antes desta prova de paredão)
    SELECT * INTO prova_palpite
    FROM provas
    WHERE tipo = 'palpite_paredao'
      AND data_prova <= NEW.data_prova
      AND arquivada = FALSE
    ORDER BY data_prova DESC
    LIMIT 1;

    -- Se encontrou uma prova de palpite correspondente
    IF prova_palpite.id IS NOT NULL THEN
      -- Iterar por cada usuário que fez apostas no palpite
      FOR aposta_record IN
        SELECT user_id, ARRAY_AGG(participante_id) as participantes_votados
        FROM apostas
        WHERE prova_id = prova_palpite.id
        GROUP BY user_id
      LOOP
        -- Contar quantos acertos o usuário teve
        SELECT COUNT(*) INTO acertos_count
        FROM unnest(aposta_record.participantes_votados) AS votado
        WHERE votado = ANY(eliminados_ids);

        -- Se teve algum acerto
        IF acertos_count > 0 THEN
          total_pontos := acertos_count * pontos_por_acerto;

          -- Atualizar pontos das apostas do usuário
          UPDATE apostas
          SET pontos = pontos_por_acerto
          WHERE prova_id = prova_palpite.id
            AND user_id = aposta_record.user_id
            AND participante_id = ANY(eliminados_ids);

          -- Atualizar pontos totais do usuário
          UPDATE profiles
          SET pontos_totais = pontos_totais + total_pontos
          WHERE id = aposta_record.user_id;

          -- Criar atividade no feed
          INSERT INTO atividades_feed (user_id, tipo, descricao, metadata)
          VALUES (
            aposta_record.user_id,
            'acerto',
            CASE
              WHEN acertos_count = 1 THEN 'Acertou 1 eliminado do paredão! +' || total_pontos || ' pontos'
              ELSE 'Acertou ' || acertos_count || ' eliminados do paredão! +' || total_pontos || ' pontos'
            END,
            jsonb_build_object(
              'prova_id', NEW.id,
              'pontos', total_pontos,
              'acertos', acertos_count,
              'tipo_prova', 'palpite_paredao'
            )
          );
        END IF;
      END LOOP;

      -- Marcar a prova de palpite como fechada também
      UPDATE provas
      SET fechada = TRUE,
          vencedor_id = NEW.vencedor_id
      WHERE id = prova_palpite.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para pontuar quando paredão for fechado
DROP TRIGGER IF EXISTS trigger_pontuar_palpite_paredao ON provas;
CREATE TRIGGER trigger_pontuar_palpite_paredao
  AFTER UPDATE ON provas
  FOR EACH ROW
  EXECUTE FUNCTION pontuar_palpite_paredao();

-- Comentário
COMMENT ON FUNCTION pontuar_palpite_paredao() IS 'Dá 10 pontos por cada eliminado certo no palpite do paredão quando o paredão é fechado';
