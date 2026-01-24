-- Corrigir foreign key constraint da tabela apostas_log
-- Permitir que apostas sejam deletadas (CASCADE)

-- Remover constraint antiga
ALTER TABLE apostas_log
DROP CONSTRAINT IF EXISTS apostas_log_aposta_id_fkey;

-- Adicionar constraint com ON DELETE CASCADE
ALTER TABLE apostas_log
ADD CONSTRAINT apostas_log_aposta_id_fkey
FOREIGN KEY (aposta_id)
REFERENCES apostas(id)
ON DELETE CASCADE;
