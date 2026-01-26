-- Script para adicionar suporte a apostas binárias (Sim/Não) com odds
-- Execute este script no seu banco de dados Supabase

-- 1. Adicionar colunas na tabela provas para apostas binárias
ALTER TABLE provas ADD COLUMN IF NOT EXISTS is_aposta_binaria BOOLEAN DEFAULT FALSE;
ALTER TABLE provas ADD COLUMN IF NOT EXISTS pergunta TEXT;
ALTER TABLE provas ADD COLUMN IF NOT EXISTS odds_sim DECIMAL(4,2);
ALTER TABLE provas ADD COLUMN IF NOT EXISTS odds_nao DECIMAL(4,2);
ALTER TABLE provas ADD COLUMN IF NOT EXISTS pontos_base INTEGER DEFAULT 5;
ALTER TABLE provas ADD COLUMN IF NOT EXISTS resposta_correta TEXT; -- 'sim' ou 'nao'

-- 2. Adicionar coluna na tabela apostas para armazenar resposta binária
ALTER TABLE apostas ADD COLUMN IF NOT EXISTS resposta_binaria TEXT; -- 'sim' ou 'nao'

-- 3. Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_provas_aposta_binaria ON provas(is_aposta_binaria);
CREATE INDEX IF NOT EXISTS idx_apostas_resposta_binaria ON apostas(resposta_binaria);

-- 4. Comentários explicativos
COMMENT ON COLUMN provas.is_aposta_binaria IS 'Indica se é uma aposta de Sim/Não ao invés de escolher participante';
COMMENT ON COLUMN provas.pergunta IS 'Pergunta da aposta binária (ex: O Big Fone vai tocar essa semana?)';
COMMENT ON COLUMN provas.odds_sim IS 'Multiplicador de pontos para resposta SIM';
COMMENT ON COLUMN provas.odds_nao IS 'Multiplicador de pontos para resposta NÃO';
COMMENT ON COLUMN provas.pontos_base IS 'Pontos base que serão multiplicados pelas odds';
COMMENT ON COLUMN provas.resposta_correta IS 'Resposta correta: sim ou nao';
COMMENT ON COLUMN apostas.resposta_binaria IS 'Resposta do usuário em apostas binárias: sim ou nao';
