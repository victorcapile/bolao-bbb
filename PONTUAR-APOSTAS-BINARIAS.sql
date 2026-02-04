-- Trigger para pontuar apostas binárias automaticamente quando a prova é fechada

CREATE OR REPLACE FUNCTION pontuar_apostas_binarias()
RETURNS TRIGGER AS $$
DECLARE
  aposta_record RECORD;
  pontos_ganhos INTEGER;
  odds_aplicada DECIMAL(4,2);
BEGIN
  -- Só processa se:
  -- 1. A prova foi fechada agora (fechada mudou de FALSE para TRUE)
  -- 2. É uma aposta binária
  -- 3. Há uma resposta correta definida
  IF NEW.fechada = TRUE
     AND OLD.fechada = FALSE
     AND NEW.is_aposta_binaria = TRUE
     AND NEW.resposta_correta IS NOT NULL THEN

    RAISE NOTICE '🎲 Pontuando aposta binária: %', NEW.id;
    RAISE NOTICE '📋 Resposta correta: %', NEW.resposta_correta;

    -- Iterar sobre todas as apostas desta prova
    FOR aposta_record IN
      SELECT a.id, a.user_id, a.resposta_binaria
      FROM apostas a
      WHERE a.prova_id = NEW.id
    LOOP
      RAISE NOTICE '👤 Processando aposta do usuário: % (resposta: %)',
                   aposta_record.user_id, aposta_record.resposta_binaria;

      -- Verificar se acertou
      IF aposta_record.resposta_binaria = NEW.resposta_correta THEN
        -- Calcular pontos com base nas odds
        IF NEW.resposta_correta = 'sim' THEN
          odds_aplicada := NEW.odds_sim;
        ELSE
          odds_aplicada := NEW.odds_nao;
        END IF;

        pontos_ganhos := ROUND(NEW.pontos_base * odds_aplicada);

        RAISE NOTICE '✅ Usuário acertou! Pontos: % (base: % × odds: %)',
                     pontos_ganhos, NEW.pontos_base, odds_aplicada;

        -- Atualizar pontos na aposta
        UPDATE apostas
        SET pontos = pontos_ganhos
        WHERE id = aposta_record.id;

        -- Adicionar pontos ao perfil do usuário
        UPDATE profiles
        SET pontos_totais = pontos_totais + pontos_ganhos
        WHERE id = aposta_record.user_id;

        RAISE NOTICE '💰 Pontos adicionados ao perfil do usuário';
      ELSE
        RAISE NOTICE '❌ Usuário errou (apostou em: %, correto era: %)',
                     aposta_record.resposta_binaria, NEW.resposta_correta;

        -- Garantir que pontos fique 0 para apostas erradas
        UPDATE apostas
        SET pontos = 0
        WHERE id = aposta_record.id;
      END IF;
    END LOOP;

    RAISE NOTICE '✅ Pontuação da aposta binária concluída';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS trigger_pontuar_apostas_binarias ON provas;

-- Criar novo trigger
CREATE TRIGGER trigger_pontuar_apostas_binarias
  AFTER UPDATE ON provas
  FOR EACH ROW
  EXECUTE FUNCTION pontuar_apostas_binarias();

COMMENT ON FUNCTION pontuar_apostas_binarias() IS 'Calcula pontos para apostas binárias quando a prova é fechada, aplicando odds';
