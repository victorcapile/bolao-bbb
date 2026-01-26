-- Script COMPLETO para diagnosticar E pontuar o paredão duplo manualmente
-- Execute este SQL no Supabase SQL Editor
-- ESTE SCRIPT É SEGURO: pode ser executado múltiplas vezes sem duplicar pontos

DO $$
DECLARE
  -- IDs dos eliminados (Matheus e Brígido)
  eliminado1 UUID := '1bc75d9c-550f-4a98-9a8a-a4fbc9d111bb'; -- Matheus
  eliminado2 UUID := '21785dfd-7249-4d6d-9472-437395385c91'; -- Brígido
  prova_palpite_id UUID;
  prova_paredao_id UUID;
  user_record RECORD;
  acertos_count INTEGER;
  total_pontos INTEGER;
  pontos_por_acerto INTEGER := 10;
  total_usuarios INTEGER := 0;
  total_acertos INTEGER := 0;
  ja_pontuado BOOLEAN := FALSE;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '🔍 DIAGNÓSTICO E PONTUAÇÃO DO PAREDÃO DUPLO';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '';

  -- Mostrar eliminados
  RAISE NOTICE '👥 ELIMINADOS:';
  RAISE NOTICE '   • Matheus: %', eliminado1;
  RAISE NOTICE '   • Brígido: %', eliminado2;
  RAISE NOTICE '';

  -- 1. Buscar a prova de palpite_paredao mais recente
  RAISE NOTICE '📋 ETAPA 1: Buscando prova de palpite_paredao...';
  SELECT id INTO prova_palpite_id
  FROM provas
  WHERE tipo = 'palpite_paredao'
  ORDER BY data_prova DESC
  LIMIT 1;

  IF prova_palpite_id IS NULL THEN
    RAISE NOTICE '   ❌ ERRO: Nenhuma prova de palpite_paredao encontrada no banco!';
    RAISE NOTICE '   → Crie uma prova de palpite_paredao no Admin primeiro.';
    RETURN;
  END IF;

  RAISE NOTICE '   ✓ Prova de palpite encontrada: %', prova_palpite_id;

  -- Mostrar detalhes da prova de palpite
  FOR user_record IN
    SELECT data_prova, fechada, created_at
    FROM provas
    WHERE id = prova_palpite_id
  LOOP
    RAISE NOTICE '   → Data: % | Fechada: % | Criada em: %',
      user_record.data_prova, user_record.fechada, user_record.created_at;
  END LOOP;
  RAISE NOTICE '';

  -- 2. Buscar prova de paredão correspondente
  RAISE NOTICE '📋 ETAPA 2: Buscando prova de paredão...';
  SELECT id INTO prova_paredao_id
  FROM provas
  WHERE tipo = 'paredao'
  ORDER BY data_prova DESC
  LIMIT 1;

  IF prova_paredao_id IS NULL THEN
    RAISE NOTICE '   ⚠ Nenhuma prova de paredão encontrada (normal se não criou ainda)';
  ELSE
    RAISE NOTICE '   ✓ Prova de paredão encontrada: %', prova_paredao_id;
  END IF;
  RAISE NOTICE '';

  -- 3. Verificar quantas apostas existem
  RAISE NOTICE '📋 ETAPA 3: Contando apostas...';
  SELECT COUNT(*) INTO total_usuarios
  FROM apostas
  WHERE prova_id = prova_palpite_id;

  IF total_usuarios = 0 THEN
    RAISE NOTICE '   ❌ ERRO: Nenhuma aposta encontrada nesta prova de palpite!';
    RAISE NOTICE '   → Os usuários precisam votar primeiro.';
    RETURN;
  END IF;

  RAISE NOTICE '   ✓ Total de apostas: %', total_usuarios;
  RAISE NOTICE '';

  -- 4. Verificar se já foi pontuado (se alguma aposta tem pontos > 0)
  SELECT EXISTS(
    SELECT 1 FROM apostas
    WHERE prova_id = prova_palpite_id
      AND pontos > 0
  ) INTO ja_pontuado;

  IF ja_pontuado THEN
    RAISE NOTICE '⚠ AVISO: Esta prova JÁ FOI PONTUADA!';
    RAISE NOTICE '   Os pontos serão RECALCULADOS e AJUSTADOS.';
    RAISE NOTICE '';
  END IF;

  -- 5. Mostrar quem votou em quem
  RAISE NOTICE '📊 ETAPA 4: Listando votos...';
  FOR user_record IN
    SELECT
      p.username,
      part.nome as participante_nome,
      a.participante_id,
      a.pontos as pontos_atuais
    FROM apostas a
    JOIN profiles p ON a.user_id = p.id
    JOIN participantes part ON a.participante_id = part.id
    WHERE a.prova_id = prova_palpite_id
    ORDER BY p.username, part.nome
  LOOP
    RAISE NOTICE '   • @% votou em: % (pontos atuais: %)',
      user_record.username,
      user_record.participante_nome,
      user_record.pontos_atuais;
  END LOOP;
  RAISE NOTICE '';

  -- 6. RESETAR pontos antigos SE já foi pontuado
  IF ja_pontuado THEN
    RAISE NOTICE '🔄 ETAPA 5: Resetando pontos antigos...';

    -- Remover pontos que foram dados anteriormente
    FOR user_record IN
      SELECT user_id, SUM(pontos) as total_pontos_antigos
      FROM apostas
      WHERE prova_id = prova_palpite_id AND pontos > 0
      GROUP BY user_id
    LOOP
      UPDATE profiles
      SET pontos_totais = pontos_totais - user_record.total_pontos_antigos
      WHERE id = user_record.user_id;

      RAISE NOTICE '   • Removidos % pontos do usuário %',
        user_record.total_pontos_antigos, user_record.user_id;
    END LOOP;

    -- Resetar pontos das apostas
    UPDATE apostas
    SET pontos = 0
    WHERE prova_id = prova_palpite_id;

    -- Deletar atividades antigas
    DELETE FROM atividades_feed
    WHERE metadata->>'tipo_prova' = 'palpite_paredao'
      AND created_at > NOW() - INTERVAL '7 days';

    RAISE NOTICE '   ✓ Pontos resetados com sucesso!';
    RAISE NOTICE '';
  END IF;

  -- 7. CALCULAR E DAR OS PONTOS
  RAISE NOTICE '💰 ETAPA 6: Calculando e distribuindo pontos...';
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

    -- Verificar acerto: Matheus
    IF eliminado1 = ANY(user_record.participantes_votados) THEN
      acertos_count := acertos_count + 1;

      UPDATE apostas
      SET pontos = pontos_por_acerto
      WHERE prova_id = prova_palpite_id
        AND user_id = user_record.user_id
        AND participante_id = eliminado1;

      RAISE NOTICE '      ✓ Acertou Matheus';
    END IF;

    -- Verificar acerto: Brígido
    IF eliminado2 = ANY(user_record.participantes_votados) THEN
      acertos_count := acertos_count + 1;

      UPDATE apostas
      SET pontos = pontos_por_acerto
      WHERE prova_id = prova_palpite_id
        AND user_id = user_record.user_id
        AND participante_id = eliminado2;

      RAISE NOTICE '      ✓ Acertou Brígido';
    END IF;

    -- Dar pontos ao usuário
    IF acertos_count > 0 THEN
      total_pontos := acertos_count * pontos_por_acerto;
      total_acertos := total_acertos + acertos_count;

      RAISE NOTICE '   👤 @% → % acertos = +% pontos',
        user_record.username, acertos_count, total_pontos;

      -- Atualizar pontos totais
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
          'tipo_prova', 'palpite_paredao',
          'eliminados', ARRAY['Matheus', 'Brígido']
        )
      );
    ELSE
      RAISE NOTICE '   👤 @% → Não acertou nenhum eliminado', user_record.username;
    END IF;
  END LOOP;

  -- 8. Fechar a prova de palpite
  UPDATE provas
  SET fechada = TRUE
  WHERE id = prova_palpite_id;

  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ RESUMO FINAL';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE 'Total de usuários: %', total_usuarios;
  RAISE NOTICE 'Total de acertos: %', total_acertos;
  RAISE NOTICE 'Prova de palpite fechada: %', prova_palpite_id;
  IF prova_paredao_id IS NOT NULL THEN
    RAISE NOTICE 'Prova de paredão: %', prova_paredao_id;
  END IF;
  RAISE NOTICE '';
  RAISE NOTICE '✅ PONTUAÇÃO CONCLUÍDA COM SUCESSO!';
  RAISE NOTICE '';
  RAISE NOTICE '📌 PRÓXIMO PASSO:';
  RAISE NOTICE '   Execute o script PONTUAR-PALPITE-PAREDAO.sql para';
  RAISE NOTICE '   ativar o cálculo automático nos próximos paredões.';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
END $$;
