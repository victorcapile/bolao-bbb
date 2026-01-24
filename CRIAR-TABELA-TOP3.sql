-- Criar tabela para armazenar o Top 3 de cada usuário
CREATE TABLE IF NOT EXISTS top3_usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  primeiro_lugar UUID REFERENCES participantes(id) ON DELETE SET NULL,
  segundo_lugar UUID REFERENCES participantes(id) ON DELETE SET NULL,
  terceiro_lugar UUID REFERENCES participantes(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Habilitar RLS
ALTER TABLE top3_usuarios ENABLE ROW LEVEL SECURITY;

-- Policy: usuários podem ver apenas seu próprio top3
CREATE POLICY "Users can view own top3"
  ON top3_usuarios
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: usuários podem inserir seu próprio top3
CREATE POLICY "Users can insert own top3"
  ON top3_usuarios
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: usuários podem atualizar seu próprio top3
CREATE POLICY "Users can update own top3"
  ON top3_usuarios
  FOR UPDATE
  USING (auth.uid() = user_id);
