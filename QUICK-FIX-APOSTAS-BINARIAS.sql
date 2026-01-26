-- ============================================================================
-- FIX RÁPIDO PARA APOSTAS BINÁRIAS
-- ============================================================================
-- Este script cria um participante dummy para permitir apostas binárias
-- funcionarem IMEDIATAMENTE sem precisar alterar a estrutura do banco
-- ============================================================================

-- Criar participante dummy para apostas binárias
INSERT INTO participantes (id, nome, ativo, foto_url)
VALUES (
    '00000000-0000-0000-0000-000000000000',
    'Sistema - Aposta Binária',
    false,
    null
)
ON CONFLICT (id) DO NOTHING;

-- Verificar se foi criado
SELECT id, nome, ativo FROM participantes WHERE id = '00000000-0000-0000-0000-000000000000';

SELECT '✅ Participante dummy criado! Apostas binárias agora funcionam.' AS status;
