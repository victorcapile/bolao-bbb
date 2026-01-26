-- Script para permitir múltiplas apostas na mesma prova (para palpite_paredao e provas customizadas)

-- 1. Primeiro, vamos ver se existe alguma constraint UNIQUE que impede múltiplas apostas
-- Execute para verificar:
SELECT
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'apostas'::regclass
    AND contype = 'u';

-- 2. Remover constraint UNIQUE se existir (user_id, prova_id)
ALTER TABLE apostas DROP CONSTRAINT IF EXISTS apostas_user_id_prova_id_key;
ALTER TABLE apostas DROP CONSTRAINT IF EXISTS unique_user_prova;
ALTER TABLE apostas DROP CONSTRAINT IF EXISTS apostas_unique_user_prova;

-- 3. Verificar e remover qualquer trigger que impeça múltiplas apostas
-- Listar todos os triggers na tabela apostas:
SELECT
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'apostas';

-- 4. Remover triggers que podem estar impedindo (ajuste os nomes se necessário)
DROP TRIGGER IF EXISTS check_single_vote ON apostas;
DROP TRIGGER IF EXISTS prevent_multiple_votes ON apostas;
DROP TRIGGER IF EXISTS ensure_single_vote_per_prova ON apostas;

-- 5. Remover função que pode estar validando voto único
DROP FUNCTION IF EXISTS check_single_vote_per_prova();
DROP FUNCTION IF EXISTS prevent_multiple_votes();

-- 6. IMPORTANTE: Precisamos manter a lógica de voto único para provas normais
-- mas permitir múltiplos votos para palpite_paredao e provas customizadas com max_escolhas > 1

-- Criar nova função de validação que permite múltiplas apostas quando apropriado
CREATE OR REPLACE FUNCTION validate_multiple_votes()
RETURNS TRIGGER AS $$
DECLARE
    prova_record RECORD;
    vote_count INTEGER;
    max_votes INTEGER;
BEGIN
    -- Buscar informações da prova
    SELECT tipo, tipo_customizado, max_escolhas, is_aposta_binaria
    INTO prova_record
    FROM provas
    WHERE id = NEW.prova_id;

    -- Se é aposta binária, sempre permite (não tem participante_id real)
    IF prova_record.is_aposta_binaria THEN
        RETURN NEW;
    END IF;

    -- Determinar quantos votos são permitidos
    IF prova_record.tipo = 'palpite_paredao' THEN
        max_votes := 3;
    ELSIF prova_record.tipo_customizado AND prova_record.max_escolhas > 1 THEN
        max_votes := prova_record.max_escolhas;
    ELSE
        max_votes := 1;
    END IF;

    -- Se permite apenas 1 voto, verificar se já existe
    IF max_votes = 1 THEN
        SELECT COUNT(*)
        INTO vote_count
        FROM apostas
        WHERE user_id = NEW.user_id
            AND prova_id = NEW.prova_id;

        IF vote_count > 0 THEN
            RAISE EXCEPTION 'Você já votou nesta prova.';
        END IF;
    ELSE
        -- Se permite múltiplos votos, verificar se não excedeu o limite
        SELECT COUNT(*)
        INTO vote_count
        FROM apostas
        WHERE user_id = NEW.user_id
            AND prova_id = NEW.prova_id;

        IF vote_count >= max_votes THEN
            RAISE EXCEPTION 'Você já atingiu o máximo de % votos para esta prova.', max_votes;
        END IF;

        -- Verificar se não está votando no mesmo participante duas vezes
        SELECT COUNT(*)
        INTO vote_count
        FROM apostas
        WHERE user_id = NEW.user_id
            AND prova_id = NEW.prova_id
            AND participante_id = NEW.participante_id;

        IF vote_count > 0 THEN
            RAISE EXCEPTION 'Você já votou neste participante.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger que usa a nova função
DROP TRIGGER IF EXISTS validate_votes_trigger ON apostas;
CREATE TRIGGER validate_votes_trigger
    BEFORE INSERT ON apostas
    FOR EACH ROW
    EXECUTE FUNCTION validate_multiple_votes();

-- Verificar o resultado
SELECT 'Script executado com sucesso! Agora múltiplas apostas são permitidas para palpite_paredao e provas customizadas.' AS status;
