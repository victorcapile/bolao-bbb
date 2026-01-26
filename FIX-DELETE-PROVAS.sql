-- Script para permitir deletar provas removendo dependências

-- 1. Remover constraint antiga e recriar com ON DELETE CASCADE na tabela apostas_log
ALTER TABLE apostas_log
DROP CONSTRAINT IF EXISTS apostas_log_prova_id_fkey;

ALTER TABLE apostas_log
ADD CONSTRAINT apostas_log_prova_id_fkey
FOREIGN KEY (prova_id)
REFERENCES provas(id)
ON DELETE CASCADE;

-- 2. Verificar e corrigir constraint na tabela apostas se necessário
ALTER TABLE apostas
DROP CONSTRAINT IF EXISTS apostas_prova_id_fkey;

ALTER TABLE apostas
ADD CONSTRAINT apostas_prova_id_fkey
FOREIGN KEY (prova_id)
REFERENCES provas(id)
ON DELETE CASCADE;

-- 3. Verificar e corrigir constraint na tabela emparedados se necessário
ALTER TABLE emparedados
DROP CONSTRAINT IF EXISTS emparedados_prova_id_fkey;

ALTER TABLE emparedados
ADD CONSTRAINT emparedados_prova_id_fkey
FOREIGN KEY (prova_id)
REFERENCES provas(id)
ON DELETE CASCADE;

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
    AND kcu.column_name = 'prova_id'
ORDER BY tc.table_name;
