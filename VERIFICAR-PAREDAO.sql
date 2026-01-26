-- Script para verificar se o paredão foi criado corretamente
-- Execute este SQL no Supabase SQL Editor

-- 1. Ver todas as provas de paredão
SELECT '=== PROVAS DE PAREDÃO ===' as info;
SELECT
  id,
  tipo,
  data_prova,
  fechada,
  vencedor_id,
  votacao_aberta,
  arquivada,
  created_at
FROM provas
WHERE tipo = 'paredao'
ORDER BY data_prova DESC;

-- 2. Ver emparedados de cada paredão
SELECT '=== EMPAREDADOS ===' as info;
SELECT
  p.id as prova_id,
  p.data_prova,
  p.fechada,
  part.nome as emparedado_nome,
  e.participante_id
FROM provas p
LEFT JOIN emparedados e ON p.id = e.prova_id
LEFT JOIN participantes part ON e.participante_id = part.id
WHERE p.tipo = 'paredao'
ORDER BY p.data_prova DESC, part.nome;

-- 3. Ver se tem prova de palpite_paredao
SELECT '=== PROVAS DE PALPITE ===' as info;
SELECT
  id,
  data_prova,
  fechada,
  created_at
FROM provas
WHERE tipo = 'palpite_paredao'
ORDER BY data_prova DESC;

-- 4. Ver apostas no palpite mais recente
SELECT '=== APOSTAS NO PALPITE ===' as info;
SELECT
  p.username,
  part.nome as votou_em,
  a.pontos,
  a.created_at
FROM apostas a
JOIN profiles p ON a.user_id = p.id
JOIN participantes part ON a.participante_id = part.id
WHERE a.prova_id = (
  SELECT id FROM provas WHERE tipo = 'palpite_paredao' ORDER BY data_prova DESC LIMIT 1
)
ORDER BY p.username, part.nome;

-- 5. Contar votos por participante no palpite
SELECT '=== CONTAGEM DE VOTOS NO PALPITE ===' as info;
SELECT
  part.nome as participante,
  COUNT(*) as total_votos
FROM apostas a
JOIN participantes part ON a.participante_id = part.id
WHERE a.prova_id = (
  SELECT id FROM provas WHERE tipo = 'palpite_paredao' ORDER BY data_prova DESC LIMIT 1
)
GROUP BY part.nome, part.id
ORDER BY total_votos DESC;
