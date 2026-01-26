-- Script para pontuar manualmente o paredão duplo de 27/01/2026
-- Eliminados: Brígido e Matheus
-- Execute este SQL no Supabase SQL Editor

-- IDs dos eliminados
-- Brígido: 21785dfd-7249-4d6d-9472-437395385c91
-- Matheus: 1bc75d9c-550f-4a98-9a8a-a4fbc9d111bb

DO $$
DECLARE
  brigido UUID := '21785dfd-7249-4d6d-9472-437395385c91';
  matheus UUID := '1bc75d9c-550f-4a98-9a8a-a4fbc9d111bb';
  prova_paredao_id UUID := '32185d32-4161-470b-85db-195328ae2053'; -- ID do paredão de 27/01
  prova_palpite_id UUID;
  user_record RECORD;
  acertos_count INTEGER;
  total_pontos INTEGER;
  pontos_por_acerto INTEGER := 10;
  total_usuarios INTEGER := 0;
  total_acertos INTEGER := 0;
BEGIN
  RAISE NOTICE '=== PONTUANDO PAREDÃO DE 27/01/2026 ===';
  RAISE NOTICE 'Eliminado: Brígido (%)' , brigido;
  RAISE NOTICE 'Eliminado: Matheus (%)', matheus;
  RAISE NOTICE 'Prova de paredão: %', prova_paredao_id;
  RAISE NOTICE '';

  -- Buscar a prova de palpite_paredao correspondente
  -- (mais recente antes do paredão de 27/01)
  SELECT id INTO prova_palpite_id
  FROM provas
  WHERE tipo = 'palpite_paredao'
    AND data_prova <= '2026-01-27'
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

    -- Verificar acerto: Brígido
    IF brigido = ANY(user_record.participantes_votados) THEN
      acertos_count := acertos_count + 1;

      UPDATE apostas
      SET pontos = pontos_por_acerto
      WHERE prova_id = prova_palpite_id
        AND user_id = user_record.user_id
        AND participante_id = brigido;

      RAISE NOTICE '  ✓ Acertou Brígido';
    END IF;

    -- Verificar acerto: Matheus
    IF matheus = ANY(user_record.participantes_votados) THEN
      acertos_count := acertos_count + 1;

      UPDATE apostas
      SET pontos = pontos_por_acerto
      WHERE prova_id = prova_palpite_id
        AND user_id = user_record.user_id
        AND participante_id = matheus;

      RAISE NOTICE '  ✓ Acertou Matheus';
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
        AND created_at > NOW() - INTERVAL '1 day';

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
          'prova_id', prova_paredao_id,
          'pontos', total_pontos,
          'acertos', acertos_count,
          'tipo_prova', 'palpite_paredao',
          'eliminados', ARRAY['Brígido', 'Matheus']
        )
      );
    ELSE
      RAISE NOTICE '👤 @% → Não acertou nenhum eliminado', user_record.username;
    END IF;
  END LOOP;

  -- Marcar a prova de palpite como fechada
  UPDATE provas
  SET fechada = TRUE,
      vencedor_id = brigido  -- Colocar um dos eliminados como referência
  WHERE id = prova_palpite_id;

  RAISE NOTICE '';
  RAISE NOTICE '=== RESUMO ===';
  RAISE NOTICE 'Total de usuários que apostaram: %', total_usuarios;
  RAISE NOTICE 'Total de acertos: %', total_acertos;
  RAISE NOTICE 'Prova de palpite fechada: %', prova_palpite_id;
  RAISE NOTICE '';
  RAISE NOTICE '✅ Pontuação concluída com sucesso!';
  RAISE NOTICE '';
  RAISE NOTICE 'ATENÇÃO: Agora execute PONTUAR-PALPITE-PAREDAO.sql para ativar o trigger automático!';
END $$;
