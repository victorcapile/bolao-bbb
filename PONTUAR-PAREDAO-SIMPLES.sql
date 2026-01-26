-- Script SIMPLIFICADO para pontuar o paredão duplo manualmente
-- Execute este SQL no Supabase SQL Editor
-- SEGURO: pode ser executado múltiplas vezes sem duplicar pontos

DO $$
DECLARE
  -- IDs dos eliminados (Matheus e Brígido)
  eliminado1 UUID := '1bc75d9c-550f-4a98-9a8a-a4fbc9d111bb'; -- Matheus
  eliminado2 UUID := '21785dfd-7249-4d6d-9472-437395385c91'; -- Brígido
  prova_palpite_id UUID;
  user_record RECORD;
  acertos_count INTEGER;
  total_pontos INTEGER;
  pontos_por_acerto INTEGER := 10;
  total_usuarios INTEGER := 0;
  total_acertos INTEGER := 0;
  pontos_antigos INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '💰 PONTUAÇÃO DO PAREDÃO DUPLO';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '👥 Eliminados:';
  RAISE NOTICE '   • Matheus: %', eliminado1;
  RAISE NOTICE '   • Brígido: %', eliminado2;
  RAISE NOTICE '';

  -- 1. Buscar a prova de palpite_paredao
  RAISE NOTICE '📋 Buscando prova de palpite...';
  SELECT id INTO prova_palpite_id
  FROM provas
  WHERE tipo = 'palpite_paredao'
  ORDER BY data_prova DESC
  LIMIT 1;

  IF prova_palpite_id IS NULL THEN
    RAISE NOTICE '   ❌ ERRO: Nenhuma prova de palpite_paredao encontrada!';
    RAISE NOTICE '   → Crie uma prova de palpite no Admin primeiro.';
    RETURN;
  END IF;

  RAISE NOTICE '   ✓ Prova encontrada: %', prova_palpite_id;
  RAISE NOTICE '';

  -- 2. Verificar apostas
  SELECT COUNT(DISTINCT user_id) INTO total_usuarios
  FROM apostas
  WHERE prova_id = prova_palpite_id;

  IF total_usuarios = 0 THEN
    RAISE NOTICE '   ❌ ERRO: Nenhuma aposta encontrada!';
    RETURN;
  END IF;

  RAISE NOTICE '📊 Total de usuários que apostaram: %', total_usuarios;
  RAISE NOTICE '';

  -- 3. Mostrar votos
  RAISE NOTICE '📝 Votos registrados:';
  FOR user_record IN
    SELECT p.username, part.nome as participante_nome
    FROM apostas a
    JOIN profiles p ON a.user_id = p.id
    JOIN participantes part ON a.participante_id = part.id
    WHERE a.prova_id = prova_palpite_id
    ORDER BY p.username, part.nome
  LOOP
    RAISE NOTICE '   • @% votou em: %', user_record.username, user_record.participante_nome;
  END LOOP;
  RAISE NOTICE '';

  -- 4. Resetar pontos antigos (se existirem)
  SELECT SUM(pontos) INTO pontos_antigos
  FROM apostas
  WHERE prova_id = prova_palpite_id AND pontos > 0;

  IF pontos_antigos > 0 THEN
    RAISE NOTICE '🔄 Resetando pontos antigos (%pts)...', pontos_antigos;

    -- Remover pontos e acertos dos perfis
    FOR user_record IN
      SELECT
        user_id,
        SUM(pontos) as total_pontos,
        COUNT(*) FILTER (WHERE pontos > 0) as total_acertos
      FROM apostas
      WHERE prova_id = prova_palpite_id AND pontos > 0
      GROUP BY user_id
    LOOP
      UPDATE profiles
      SET pontos_totais = GREATEST(0, pontos_totais - user_record.total_pontos),
          acertos = GREATEST(0, acertos - user_record.total_acertos)
      WHERE id = user_record.user_id;
    END LOOP;

    -- Resetar pontos das apostas
    UPDATE apostas
    SET pontos = 0
    WHERE prova_id = prova_palpite_id;

    RAISE NOTICE '   ✓ Pontos resetados!';
    RAISE NOTICE '';
  END IF;

  -- 5. CALCULAR E DAR PONTOS
  RAISE NOTICE '💰 Calculando pontos...';
  RAISE NOTICE '';

  total_usuarios := 0;
  total_acertos := 0;

  FOR user_record IN
    SELECT
      a.user_id,
      p.username,
      ARRAY_AGG(a.participante_id) as participantes_votados
    FROM apostas a
    JOIN profiles p ON a.user_id = p.id
    WHERE a.prova_id = prova_palpite_id
    GROUP BY a.user_id, p.username
    ORDER BY p.username
  LOOP
    total_usuarios := total_usuarios + 1;
    acertos_count := 0;

    -- Verificar Matheus
    IF eliminado1 = ANY(user_record.participantes_votados) THEN
      acertos_count := acertos_count + 1;
      UPDATE apostas
      SET pontos = pontos_por_acerto
      WHERE prova_id = prova_palpite_id
        AND user_id = user_record.user_id
        AND participante_id = eliminado1;
    END IF;

    -- Verificar Brígido
    IF eliminado2 = ANY(user_record.participantes_votados) THEN
      acertos_count := acertos_count + 1;
      UPDATE apostas
      SET pontos = pontos_por_acerto
      WHERE prova_id = prova_palpite_id
        AND user_id = user_record.user_id
        AND participante_id = eliminado2;
    END IF;

    -- Dar pontos
    IF acertos_count > 0 THEN
      total_pontos := acertos_count * pontos_por_acerto;
      total_acertos := total_acertos + acertos_count;

      UPDATE profiles
      SET pontos_totais = pontos_totais + total_pontos,
          acertos = acertos + acertos_count
      WHERE id = user_record.user_id;

      RAISE NOTICE '   ✓ @% → % acertos = +%pts', user_record.username, acertos_count, total_pontos;
    ELSE
      RAISE NOTICE '   ✗ @% → Não acertou', user_record.username;
    END IF;
  END LOOP;

  -- 6. Fechar a prova
  UPDATE provas
  SET fechada = TRUE
  WHERE id = prova_palpite_id;

  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '✅ RESUMO FINAL';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE 'Usuários: %', total_usuarios;
  RAISE NOTICE 'Total de acertos: %', total_acertos;
  RAISE NOTICE 'Prova fechada: %', prova_palpite_id;
  RAISE NOTICE '';
  RAISE NOTICE '✅ PONTUAÇÃO CONCLUÍDA!';
  RAISE NOTICE '';
  RAISE NOTICE '📌 PRÓXIMO PASSO:';
  RAISE NOTICE '   Execute PONTUAR-PALPITE-PAREDAO.sql para ativar';
  RAISE NOTICE '   o cálculo automático nos próximos paredões.';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '';
END $$;
