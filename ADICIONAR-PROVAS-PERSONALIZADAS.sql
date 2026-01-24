-- Script para adicionar suporte a provas personalizadas
-- Execute este SQL no Supabase SQL Editor

-- Adicionar colunas para provas personalizadas na tabela provas
ALTER TABLE provas
ADD COLUMN IF NOT EXISTS titulo_customizado TEXT,
ADD COLUMN IF NOT EXISTS max_escolhas INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS tipo_customizado BOOLEAN DEFAULT FALSE;

-- Comentários explicativos
COMMENT ON COLUMN provas.titulo_customizado IS 'Título customizado para a prova (ex: "Quem vai brigar na próxima festa?")';
COMMENT ON COLUMN provas.max_escolhas IS 'Número máximo de participantes que podem ser escolhidos (1 = escolha única, 3 = top 3, etc)';
COMMENT ON COLUMN provas.tipo_customizado IS 'Indica se é uma prova customizada (true) ou prova padrão do sistema (false)';

-- Atualizar provas existentes para terem os valores padrão
UPDATE provas
SET tipo_customizado = FALSE,
    max_escolhas = CASE
        WHEN tipo IN ('lider', 'anjo', 'bate_volta') THEN 1
        WHEN tipo = 'palpite_paredao' THEN 3
        ELSE 1
    END
WHERE tipo_customizado IS NULL;
