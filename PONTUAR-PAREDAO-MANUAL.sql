-- Script para pontuar manualmente o paredão duplo que já aconteceu
-- Execute este SQL no Supabase SQL Editor para corrigir a pontuação

-- IDs dos eliminados
-- 1bc75d9c-550f-4a98-9a8a-a4fbc9d111bb
-- 21785dfd-7249-4d6d-9472-437395385c91

DO $$
DECLARE
  eliminado1 UUID := '1bc75d9c-550f-4a98-9a8a-a4fbc9d111bb';
  eliminado2 UUID := '21785dfd-7249-4d6d-9472-437395385c91';
  prova_palpite_id UUID;
  user_record RECORD;
  acertos_count INTEGER;
  total_pontos INTEGER;
  pontos_por_acerto INTEGER := 10;
BEGIN
  -- Buscar a prova de palpite_paredao mais recente que não está fechada ou a última fechada
  SELECT id INTO prova_palpite_id
  FROM provas
  WHERE tipo = 'palpite_paredao'
  ORDER BY data_prova DESC
  LIMIT 1;

  IF prova_palpite_id IS NULL THEN
    RAISE NOTICE 'Nenhuma prova de palpite_paredao encontrada';
    RETURN;
  END IF;

  RAISE NOTICE 'Pontuando prova de palpite: %', prova_palpite_id;

  -- Iterar por cada usuário que fez apostas no palpite
  FOR user_record IN
    SELECT user_id,
           ARRAY_AGG(participante_id) as participantes_votados,
           ARRAY_AGG(id) as apostas_ids
    FROM apostas
    WHERE prova_id = prova_palpite_id
    GROUP BY user_id
  LOOP
    -- Contar quantos eliminados o usuário acertou
    acertos_count := 0;

    IF eliminado1 = ANY(user_record.participantes_votados) THEN
      acertos_count := acertos_count + 1;

      -- Atualizar pontos da aposta do eliminado1
      UPDATE apostas
      SET pontos = pontos_por_acerto
      WHERE prova_id = prova_palpite_id
        AND user_id = user_record.user_id
        AND participante_id = eliminado1;
    END IF;

    IF eliminado2 = ANY(user_record.participantes_votados) THEN
      acertos_count := acertos_count + 1;

      -- Atualizar pontos da aposta do eliminado2
      UPDATE apostas
      SET pontos = pontos_por_acerto
      WHERE prova_id = prova_palpite_id
        AND user_id = user_record.user_id
        AND participante_id = eliminado2;
    END IF;

    -- Se teve algum acerto
    IF acertos_count > 0 THEN
      total_pontos := acertos_count * pontos_por_acerto;

      RAISE NOTICE 'Usuário % acertou % eliminados = % pontos',
        user_record.user_id, acertos_count, total_pontos;

      -- Atualizar pontos totais do usuário
      UPDATE profiles
      SET pontos_totais = pontos_totais + total_pontos
      WHERE id = user_record.user_id;

      -- Criar atividade no feed
      INSERT INTO atividades_feed (user_id, tipo, descricao, metadata)
      VALUES (
        user_record.user_id,
        'acerto',
        CASE
          WHEN acertos_count = 1 THEN 'Acertou 1 eliminado do paredão! +' || total_pontos || ' pontos'
          ELSE 'Acertou ' || acertos_count || ' eliminados do paredão! +' || total_pontos || ' pontos'
        END,
        jsonb_build_object(
          'pontos', total_pontos,
          'acertos', acertos_count,
          'tipo_prova', 'palpite_paredao'
        )
      );
    END IF;
  END LOOP;

  -- Marcar a prova de palpite como fechada
  UPDATE provas
  SET fechada = TRUE
  WHERE id = prova_palpite_id;

  RAISE NOTICE 'Pontuação concluída!';
END $$;
