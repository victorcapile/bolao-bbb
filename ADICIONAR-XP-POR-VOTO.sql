-- Script para adicionar XP quando usuário faz uma aposta
-- Execute este SQL no Supabase SQL Editor

-- Função para calcular XP necessário para cada nível
CREATE OR REPLACE FUNCTION calcular_nivel_por_xp(total_xp INTEGER)
RETURNS INTEGER AS $$
DECLARE
  nivel INTEGER := 1;
  xp_acumulado INTEGER := 0;
  xp_proximo_nivel INTEGER := 100;
BEGIN
  WHILE total_xp >= xp_acumulado + xp_proximo_nivel LOOP
    xp_acumulado := xp_acumulado + xp_proximo_nivel;
    nivel := nivel + 1;
    xp_proximo_nivel := nivel * 100; -- Nível 1: 100 XP, Nível 2: 200 XP, Nível 3: 300 XP
  END LOOP;

  RETURN nivel;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Função para dar XP quando usuário faz uma aposta
CREATE OR REPLACE FUNCTION dar_xp_por_aposta()
RETURNS TRIGGER AS $$
DECLARE
  xp_ganho INTEGER := 50; -- XP ganho por cada aposta
  novo_xp INTEGER;
  novo_nivel INTEGER;
  nivel_anterior INTEGER;
BEGIN
  -- Pegar XP e nível atual
  SELECT xp, nivel INTO novo_xp, nivel_anterior
  FROM profiles
  WHERE id = NEW.user_id;

  -- Adicionar XP
  novo_xp := novo_xp + xp_ganho;

  -- Calcular novo nível baseado no total de XP
  novo_nivel := calcular_nivel_por_xp(novo_xp);

  -- Atualizar profile
  UPDATE profiles
  SET xp = novo_xp,
      nivel = novo_nivel
  WHERE id = NEW.user_id;

  -- Se subiu de nível, criar atividade no feed
  IF novo_nivel > nivel_anterior THEN
    INSERT INTO atividades_feed (user_id, tipo, descricao, metadata)
    VALUES (
      NEW.user_id,
      'nivel_up',
      'Subiu para o nível ' || novo_nivel || '!',
      jsonb_build_object('nivel_anterior', nivel_anterior, 'nivel_novo', novo_nivel)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para dar XP quando aposta é criada
DROP TRIGGER IF EXISTS trigger_xp_por_aposta ON apostas;
CREATE TRIGGER trigger_xp_por_aposta
  AFTER INSERT ON apostas
  FOR EACH ROW
  EXECUTE FUNCTION dar_xp_por_aposta();

-- Comentário
COMMENT ON FUNCTION dar_xp_por_aposta() IS 'Dá 5 XP ao usuário quando faz uma aposta e verifica se subiu de nível';
