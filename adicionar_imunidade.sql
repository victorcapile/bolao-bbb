-- Execute este comando no Editor SQL do seu projeto Supabase para adicionar a coluna necessária

ALTER TABLE public.participantes 
ADD COLUMN is_imune_atual BOOLEAN DEFAULT FALSE;

-- Atualizar a permissão para permitir que a coluna seja visível (se necessário, dependendo das suas policies)
-- Geralmente, se você já tem policies para update, elas devem cobrir novas colunas, mas garanta que o admin pode editar.
