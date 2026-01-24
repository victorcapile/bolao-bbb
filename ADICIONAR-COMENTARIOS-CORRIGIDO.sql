-- Tabela de comentários em apostas
CREATE TABLE IF NOT EXISTS comentarios_apostas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aposta_id UUID NOT NULL REFERENCES apostas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  comentario TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de notificações
CREATE TABLE IF NOT EXISTS notificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL, -- 'comentario', 'reacao'
  referencia_id UUID NOT NULL, -- ID do comentário ou reação
  lida BOOLEAN DEFAULT FALSE,
  mensagem TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_comentarios_apostas_aposta_id ON comentarios_apostas(aposta_id);
CREATE INDEX IF NOT EXISTS idx_comentarios_apostas_user_id ON comentarios_apostas(user_id);
CREATE INDEX IF NOT EXISTS idx_comentarios_apostas_created_at ON comentarios_apostas(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notificacoes_user_id ON notificacoes(user_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_lida ON notificacoes(lida);

-- RLS para comentários
ALTER TABLE comentarios_apostas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver todos os comentários"
  ON comentarios_apostas FOR SELECT
  USING (true);

CREATE POLICY "Usuários podem criar comentários"
  ON comentarios_apostas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios comentários"
  ON comentarios_apostas FOR DELETE
  USING (auth.uid() = user_id);

-- RLS para notificações
ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver suas próprias notificações"
  ON notificacoes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias notificações"
  ON notificacoes FOR UPDATE
  USING (auth.uid() = user_id);

-- Função para criar notificação quando alguém comenta
CREATE OR REPLACE FUNCTION criar_notificacao_comentario()
RETURNS TRIGGER AS $$
DECLARE
  aposta_owner_id UUID;
  comentador_username TEXT;
BEGIN
  -- Buscar o dono da aposta
  SELECT user_id INTO aposta_owner_id
  FROM apostas
  WHERE id = NEW.aposta_id;

  -- Buscar username de quem comentou
  SELECT username INTO comentador_username
  FROM profiles
  WHERE id = NEW.user_id;

  -- Só criar notificação se não for o próprio dono comentando
  IF aposta_owner_id != NEW.user_id THEN
    INSERT INTO notificacoes (user_id, tipo, referencia_id, mensagem)
    VALUES (
      aposta_owner_id,
      'comentario',
      NEW.id,
      comentador_username || ' comentou em sua aposta'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para notificação de comentário
DROP TRIGGER IF EXISTS trigger_notificacao_comentario ON comentarios_apostas;
CREATE TRIGGER trigger_notificacao_comentario
  AFTER INSERT ON comentarios_apostas
  FOR EACH ROW
  EXECUTE FUNCTION criar_notificacao_comentario();

-- Função para criar notificação quando alguém reage
CREATE OR REPLACE FUNCTION criar_notificacao_reacao()
RETURNS TRIGGER AS $$
DECLARE
  aposta_owner_id UUID;
  reator_username TEXT;
BEGIN
  -- Buscar o dono da aposta
  SELECT user_id INTO aposta_owner_id
  FROM apostas
  WHERE id = NEW.aposta_id;

  -- Buscar username de quem reagiu
  SELECT username INTO reator_username
  FROM profiles
  WHERE id = NEW.user_id;

  -- Só criar notificação se não for o próprio dono reagindo
  IF aposta_owner_id != NEW.user_id THEN
    INSERT INTO notificacoes (user_id, tipo, referencia_id, mensagem)
    VALUES (
      aposta_owner_id,
      'reacao',
      NEW.id,
      reator_username || ' reagiu à sua aposta'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para notificação de reação
DROP TRIGGER IF EXISTS trigger_notificacao_reacao ON reacoes_votos;
CREATE TRIGGER trigger_notificacao_reacao
  AFTER INSERT ON reacoes_votos
  FOR EACH ROW
  EXECUTE FUNCTION criar_notificacao_reacao();
