-- Script para pontuar manualmente o paredão duplo que já aconteceu
-- Execute este SQL no Supabase SQL Editor para corrigir a pontuação
-- IMPORTANTE: Este script pode ser executado múltiplas vezes, ele NÃO duplica pontos

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
  total_usuarios INTEGER := 0;
  total_acertos INTEGER := 0;
BEGIN
  RAISE NOTICE '=== INICIANDO PONTUAÇÃO DO PAREDÃO DUPLO ===';
  RAISE NOTICE 'Eliminado 1: %', eliminado1;
  RAISE NOTICE 'Eliminado 2: %', eliminado2;
  RAISE NOTICE '';

  -- Buscar a prova de palpite_paredao mais recente
  SELECT id INTO prova_palpite_id
  FROM provas
  WHERE tipo = 'palpite_paredao'
  ORDER BY data_prova DESC
  LIMIT 1;

  IF prova_palpite_id IS NULL THEN
    RAISE NOTICE '❌ ERRO: Nenhuma prova de palpite_paredao encontrada!';
    RETURN;
  END IF;

  RAISE NOTICE '✓ Prova de palpite encontrada: %', prova_palpite_id;
  RAISE NOTICE '';

  -- Iterar por cada usuário que fez apostas no palpite
  FOR user_record IN
    SELECT
      a.user_id,
      p.username,
      ARRAY_AGG(a.participante_id) as participantes_votados,
      ARRAY_AGG(a.id) as apostas_ids
    FROM apostas a
    JOIN profiles p ON a.user_id = p.id
    WHERE a.prova_id = prova_palpite_id
    GROUP BY a.user_id, p.username
    ORDER BY p.username
  LOOP
    total_usuarios := total_usuarios + 1;
    acertos_count := 0;

    -- Verificar acerto do eliminado 1
    IF eliminado1 = ANY(user_record.participantes_votados) THEN
      acertos_count := acertos_count + 1;

      -- Atualizar pontos da aposta do eliminado1
      UPDATE apostas
      SET pontos = pontos_por_acerto
      WHERE prova_id = prova_palpite_id
        AND user_id = user_record.user_id
        AND participante_id = eliminado1;

      RAISE NOTICE '  ✓ Acertou eliminado 1';
    END IF;

    -- Verificar acerto do eliminado 2
    IF eliminado2 = ANY(user_record.participantes_votados) THEN
      acertos_count := acertos_count + 1;

      -- Atualizar pontos da aposta do eliminado2
      UPDATE apostas
      SET pontos = pontos_por_acerto
      WHERE prova_id = prova_palpite_id
        AND user_id = user_record.user_id
        AND participante_id = eliminado2;

      RAISE NOTICE '  ✓ Acertou eliminado 2';
    END IF;

    -- Se teve algum acerto, dar pontos
    IF acertos_count > 0 THEN
      total_pontos := acertos_count * pontos_por_acerto;
      total_acertos := total_acertos + acertos_count;

      RAISE NOTICE '👤 @% → % acertos = +% pontos',
        user_record.username, acertos_count, total_pontos;

      -- Atualizar pontos totais do usuário
      UPDATE profiles
      SET pontos_totais = pontos_totais + total_pontos
      WHERE id = user_record.user_id;

      -- Deletar atividade antiga se existir (evita duplicatas)
      DELETE FROM atividades_feed
      WHERE user_id = user_record.user_id
        AND tipo = 'acerto'
        AND metadata->>'tipo_prova' = 'palpite_paredao'
        AND created_at > NOW() - INTERVAL '1 hour';

      -- Criar nova atividade no feed
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
    ELSE
      RAISE NOTICE '👤 @% → Não acertou nenhum eliminado', user_record.username;
    END IF;
  END LOOP;

  -- Marcar a prova de palpite como fechada
  UPDATE provas
  SET fechada = TRUE
  WHERE id = prova_palpite_id;

  RAISE NOTICE '';
  RAISE NOTICE '=== RESUMO ===';
  RAISE NOTICE 'Total de usuários processados: %', total_usuarios;
  RAISE NOTICE 'Total de acertos: %', total_acertos;
  RAISE NOTICE 'Prova de palpite fechada: %', prova_palpite_id;
  RAISE NOTICE '';
  RAISE NOTICE '✅ Pontuação concluída com sucesso!';
END $$;
