-- Script para dar pontos aos usuários que acertaram o palpite do paredão
-- Execute este SQL no Supabase SQL Editor

-- Função para pontuar palpite de paredão quando uma prova é fechada
CREATE OR REPLACE FUNCTION pontuar_palpite_paredao()
RETURNS TRIGGER AS $$
DECLARE
  prova_palpite RECORD;
  aposta_record RECORD;
  pontos_ganhos INTEGER := 100;
BEGIN
  -- Verificar se a prova que foi fechada é um PAREDÃO (não palpite)
  IF NEW.fechada = TRUE AND OLD.fechada = FALSE AND NEW.tipo = 'paredao' AND NEW.vencedor_id IS NOT NULL THEN

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
      -- Buscar todas as apostas na prova de palpite que votaram no vencedor do paredão
      FOR aposta_record IN
        SELECT DISTINCT ON (user_id) *
        FROM apostas
        WHERE prova_id = prova_palpite.id
          AND participante_id = NEW.vencedor_id
      LOOP
        -- Atualizar pontos da aposta
        UPDATE apostas
        SET pontos = pontos_ganhos
        WHERE id = aposta_record.id;

        -- Atualizar pontos totais do usuário
        UPDATE profiles
        SET pontos_totais = pontos_totais + pontos_ganhos
        WHERE id = aposta_record.user_id;

        -- Criar atividade no feed
        INSERT INTO atividades_feed (user_id, tipo, descricao, metadata)
        VALUES (
          aposta_record.user_id,
          'acerto',
          'Acertou o palpite do paredão! +' || pontos_ganhos || ' pontos',
          jsonb_build_object(
            'prova_id', NEW.id,
            'pontos', pontos_ganhos,
            'tipo_prova', 'palpite_paredao'
          )
        );
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
COMMENT ON FUNCTION pontuar_palpite_paredao() IS 'Dá 100 pontos aos usuários que acertaram o palpite do paredão quando o paredão é fechado';
