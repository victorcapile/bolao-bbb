-- Script para debugar a pontuação do palpite de paredão
-- Execute este SQL no Supabase SQL Editor

-- 1. Verificar se existe prova de palpite_paredao
SELECT 'Provas de Palpite Paredão:' as info;
SELECT id, tipo, data_prova, fechada, created_at
FROM provas
WHERE tipo = 'palpite_paredao'
ORDER BY data_prova DESC;

-- 2. Verificar apostas na prova de palpite
SELECT 'Apostas no Palpite Paredão:' as info;
SELECT a.id, a.user_id, p.username, a.participante_id, part.nome as participante_nome, a.pontos, a.created_at
FROM apostas a
JOIN profiles p ON a.user_id = p.id
JOIN participantes part ON a.participante_id = part.id
WHERE a.prova_id IN (
  SELECT id FROM provas WHERE tipo = 'palpite_paredao' ORDER BY data_prova DESC LIMIT 1
)
ORDER BY p.username, a.created_at;

-- 3. Verificar se os eliminados estão nas apostas
SELECT 'Verificando votos nos eliminados:' as info;
SELECT
  p.username,
  COUNT(*) as total_votos,
  COUNT(CASE WHEN a.participante_id = '1bc75d9c-550f-4a98-9a8a-a4fbc9d111bb' THEN 1 END) as votou_eliminado1,
  COUNT(CASE WHEN a.participante_id = '21785dfd-7249-4d6d-9472-437395385c91' THEN 1 END) as votou_eliminado2
FROM apostas a
JOIN profiles p ON a.user_id = p.id
WHERE a.prova_id IN (
  SELECT id FROM provas WHERE tipo = 'palpite_paredao' ORDER BY data_prova DESC LIMIT 1
)
GROUP BY p.username
ORDER BY p.username;

-- 4. Verificar se existe trigger
SELECT 'Triggers na tabela provas:' as info;
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'provas'
  AND trigger_schema = 'public';

-- 5. Verificar provas de paredão
SELECT 'Provas de Paredão:' as info;
SELECT id, tipo, data_prova, fechada, vencedor_id, created_at
FROM provas
WHERE tipo = 'paredao'
ORDER BY data_prova DESC;

-- 6. Verificar emparedados
SELECT 'Emparedados das provas de Paredão:' as info;
SELECT e.prova_id, p.data_prova, part.nome as emparedado_nome, e.participante_id
FROM emparedados e
JOIN provas p ON e.prova_id = p.id
JOIN participantes part ON e.participante_id = part.id
WHERE p.tipo = 'paredao'
ORDER BY p.data_prova DESC;
