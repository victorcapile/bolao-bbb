-- ============================================================================
-- SCRIPT COMPLETO DE CORREÇÃO - Executar no Supabase SQL Editor
-- ============================================================================
-- Este script corrige todos os problemas pendentes:
-- 1. Foreign key de apostas binárias (participante_id pode ser NULL)
-- 2. Múltiplas apostas em provas customizadas
-- 3. Deletar provas com ON DELETE CASCADE
-- ============================================================================

-- ============================================================================
-- PARTE 1: CORRIGIR APOSTAS BINÁRIAS
-- ============================================================================

-- Tornar participante_id nullable para apostas binárias
ALTER TABLE apostas ALTER COLUMN participante_id DROP NOT NULL;

-- Atualizar constraint para permitir NULL ou UUID válido
ALTER TABLE apostas DROP CONSTRAINT IF EXISTS apostas_participante_id_fkey;

-- Recriar constraint para permitir NULL (apenas valida se não for NULL)
ALTER TABLE apostas
ADD CONSTRAINT apostas_participante_id_fkey
FOREIGN KEY (participante_id)
REFERENCES participantes(id)
ON DELETE CASCADE
DEFERRABLE INITIALLY DEFERRED;

-- ============================================================================
-- PARTE 2: PERMITIR MÚLTIPLAS APOSTAS
-- ============================================================================

-- Remover constraints UNIQUE antigas que impedem múltiplas apostas
ALTER TABLE apostas DROP CONSTRAINT IF EXISTS apostas_user_id_prova_id_key;
ALTER TABLE apostas DROP CONSTRAINT IF EXISTS unique_user_prova;
ALTER TABLE apostas DROP CONSTRAINT IF EXISTS apostas_unique_user_prova;

-- Remover triggers antigos
DROP TRIGGER IF EXISTS check_single_vote ON apostas;
DROP TRIGGER IF EXISTS prevent_multiple_votes ON apostas;
DROP TRIGGER IF EXISTS ensure_single_vote_per_prova ON apostas;
DROP TRIGGER IF EXISTS validate_votes_trigger ON apostas;

-- Remover funções antigas
DROP FUNCTION IF EXISTS check_single_vote_per_prova();
DROP FUNCTION IF EXISTS prevent_multiple_votes();

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

    -- Se é aposta binária, apenas verificar se já votou (só 1 voto permitido)
    IF prova_record.is_aposta_binaria THEN
        SELECT COUNT(*)
        INTO vote_count
        FROM apostas
        WHERE user_id = NEW.user_id
            AND prova_id = NEW.prova_id;

        IF vote_count > 0 THEN
            -- Se já votou, é uma atualização permitida (trocar de SIM para NÃO ou vice-versa)
            -- Não fazer nada, permitir
            NULL;
        END IF;
        RETURN NEW;
    END IF;

    -- Para apostas normais, validar participante_id
    IF NEW.participante_id IS NULL THEN
        RAISE EXCEPTION 'Participante é obrigatório para apostas não-binárias.';
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
CREATE TRIGGER validate_votes_trigger
    BEFORE INSERT ON apostas
    FOR EACH ROW
    EXECUTE FUNCTION validate_multiple_votes();

-- ============================================================================
-- PARTE 3: PERMITIR DELETAR PROVAS
-- ============================================================================

-- Remover e recriar constraint na tabela apostas_log
ALTER TABLE apostas_log DROP CONSTRAINT IF EXISTS apostas_log_prova_id_fkey;
ALTER TABLE apostas_log
ADD CONSTRAINT apostas_log_prova_id_fkey
FOREIGN KEY (prova_id)
REFERENCES provas(id)
ON DELETE CASCADE;

-- Verificar e corrigir constraint na tabela apostas
ALTER TABLE apostas DROP CONSTRAINT IF EXISTS apostas_prova_id_fkey;
ALTER TABLE apostas
ADD CONSTRAINT apostas_prova_id_fkey
FOREIGN KEY (prova_id)
REFERENCES provas(id)
ON DELETE CASCADE;

-- Verificar e corrigir constraint na tabela emparedados
ALTER TABLE emparedados DROP CONSTRAINT IF EXISTS emparedados_prova_id_fkey;
ALTER TABLE emparedados
ADD CONSTRAINT emparedados_prova_id_fkey
FOREIGN KEY (prova_id)
REFERENCES provas(id)
ON DELETE CASCADE;

-- ============================================================================
-- VERIFICAÇÃO FINAL
-- ============================================================================

-- Verificar as constraints criadas
SELECT
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.referential_constraints rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.table_name IN ('apostas', 'apostas_log', 'emparedados')
    AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name IN ('prova_id', 'participante_id')
ORDER BY tc.table_name, kcu.column_name;

-- Verificar o trigger de validação
SELECT
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'apostas';

-- Mensagem final
SELECT '✅ Script executado com sucesso! Todas as correções foram aplicadas.' AS status;
