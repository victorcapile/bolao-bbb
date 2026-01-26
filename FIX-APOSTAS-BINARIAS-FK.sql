-- Script para permitir apostas binárias sem participante_id válido

-- Opção 1: Tornar participante_id nullable (RECOMENDADO)
-- Isso permite que apostas binárias não precisem de um participante
ALTER TABLE apostas ALTER COLUMN participante_id DROP NOT NULL;

-- Opção 2: Adicionar um participante dummy para apostas binárias (ALTERNATIVA)
-- Caso você prefira manter a coluna NOT NULL, podemos criar um participante especial
-- Descomente as linhas abaixo se preferir essa abordagem:

/*
-- Criar participante dummy para apostas binárias (se não existir)
INSERT INTO participantes (id, nome, ativo, foto_url)
VALUES (
    '00000000-0000-0000-0000-000000000000',
    'Sistema - Aposta Binária',
    false,
    null
)
ON CONFLICT (id) DO NOTHING;
*/

-- Atualizar constraint para permitir NULL ou UUID válido
ALTER TABLE apostas
DROP CONSTRAINT IF EXISTS apostas_participante_id_fkey;

-- Recriar constraint para permitir NULL (apenas valida se não for NULL)
ALTER TABLE apostas
ADD CONSTRAINT apostas_participante_id_fkey
FOREIGN KEY (participante_id)
REFERENCES participantes(id)
ON DELETE CASCADE
DEFERRABLE INITIALLY DEFERRED;

-- Atualizar a função de validação para não validar participante_id em apostas binárias
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

-- Verificar resultado
SELECT 'Script executado com sucesso! Apostas binárias agora podem ter participante_id NULL.' AS status;
