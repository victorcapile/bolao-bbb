-- Script para adicionar controle de votação nas provas
-- Execute este SQL no Supabase SQL Editor

-- Adicionar coluna para controlar se a votação está aberta
ALTER TABLE provas
ADD COLUMN IF NOT EXISTS votacao_aberta BOOLEAN DEFAULT TRUE;

-- Comentário explicativo
COMMENT ON COLUMN provas.votacao_aberta IS 'Controla se usuários podem fazer novas apostas (true = permite votos, false = bloqueia votos)';

-- Atualizar provas existentes
UPDATE provas
SET votacao_aberta = TRUE
WHERE votacao_aberta IS NULL;

-- Provas fechadas devem ter votação fechada também
UPDATE provas
SET votacao_aberta = FALSE
WHERE fechada = TRUE AND votacao_aberta = TRUE;
