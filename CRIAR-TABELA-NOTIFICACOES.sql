-- ============================================================================
-- CRIAR TABELA DE NOTIFICAÇÕES IN-APP
-- ============================================================================
-- Notificações são criadas quando:
-- 1. Usuário acerta uma aposta e ganha pontos
-- 2. Nova prova é criada
-- 3. Outros eventos importantes
-- ============================================================================

-- Criar tabela de notificações
CREATE TABLE IF NOT EXISTS notificacoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL, -- 'pontos_ganhos', 'nova_prova', 'nivel_up', etc
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  lida BOOLEAN DEFAULT FALSE,
  prova_id UUID REFERENCES provas(id) ON DELETE SET NULL,
  pontos INTEGER,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_notificacoes_user_id ON notificacoes(user_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_lida ON notificacoes(lida);
CREATE INDEX IF NOT EXISTS idx_notificacoes_created_at ON notificacoes(created_at DESC);

-- RLS (Row Level Security)
ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;

-- Policy: usuários só podem ver suas próprias notificações
DROP POLICY IF EXISTS "Users can view their own notifications" ON notificacoes;
CREATE POLICY "Users can view their own notifications"
  ON notificacoes FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: usuários podem marcar suas notificações como lidas
DROP POLICY IF EXISTS "Users can update their own notifications" ON notificacoes;
CREATE POLICY "Users can update their own notifications"
  ON notificacoes FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: sistema pode criar notificações
DROP POLICY IF EXISTS "Service role can insert notifications" ON notificacoes;
CREATE POLICY "Service role can insert notifications"
  ON notificacoes FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- FUNÇÃO: Criar notificação quando usuário ganha pontos
-- ============================================================================

CREATE OR REPLACE FUNCTION criar_notificacao_pontos()
RETURNS TRIGGER AS $$
DECLARE
  prova_info RECORD;
  nivel_antigo INTEGER;
  nivel_novo INTEGER;
  pontos_ganhos INTEGER;
BEGIN
  -- Só executa quando uma aposta ganha pontos (UPDATE com pontos > 0)
  IF NEW.pontos > 0 AND (OLD.pontos = 0 OR OLD.pontos IS NULL) THEN
    pontos_ganhos := NEW.pontos;

    -- Buscar informações da prova
    SELECT
      tipo,
      descricao,
      titulo_customizado,
      pergunta,
      is_aposta_binaria,
      tipo_customizado
    INTO prova_info
    FROM provas
    WHERE id = NEW.prova_id;

    -- Determinar título da notificação
    DECLARE
      titulo_notif TEXT;
      mensagem_notif TEXT;
    BEGIN
      IF prova_info.is_aposta_binaria THEN
        titulo_notif := '🎉 Você acertou!';
        mensagem_notif := 'Parabéns! Você ganhou ' || pontos_ganhos || ' pontos na aposta "' || prova_info.pergunta || '"';
      ELSIF prova_info.tipo_customizado THEN
        titulo_notif := '🎯 Acertou!';
        mensagem_notif := 'Você ganhou ' || pontos_ganhos || ' pontos em "' || prova_info.titulo_customizado || '"';
      ELSIF prova_info.tipo = 'palpite_paredao' THEN
        titulo_notif := '🔥 Palpitou certo!';
        mensagem_notif := 'Você acertou o paredão e ganhou ' || pontos_ganhos || ' pontos!';
      ELSIF prova_info.tipo = 'paredao' THEN
        titulo_notif := '🔥 Acertou o paredão!';
        mensagem_notif := 'Você ganhou ' || pontos_ganhos || ' pontos por acertar quem saiu!';
      ELSIF prova_info.tipo = 'lider' THEN
        titulo_notif := '👑 Acertou o líder!';
        mensagem_notif := 'Você ganhou ' || pontos_ganhos || ' pontos por acertar o líder!';
      ELSIF prova_info.tipo = 'anjo' THEN
        titulo_notif := '😇 Acertou o anjo!';
        mensagem_notif := 'Você ganhou ' || pontos_ganhos || ' pontos por acertar o anjo!';
      ELSIF prova_info.tipo = 'bate_volta' THEN
        titulo_notif := '🏃 Acertou o bate e volta!';
        mensagem_notif := 'Você ganhou ' || pontos_ganhos || ' pontos!';
      ELSE
        titulo_notif := '✨ Você acertou!';
        mensagem_notif := 'Parabéns! Você ganhou ' || pontos_ganhos || ' pontos!';
      END IF;

      -- Criar notificação
      INSERT INTO notificacoes (
        user_id,
        tipo,
        titulo,
        mensagem,
        prova_id,
        pontos,
        metadata
      ) VALUES (
        NEW.user_id,
        'pontos_ganhos',
        titulo_notif,
        mensagem_notif,
        NEW.prova_id,
        pontos_ganhos,
        jsonb_build_object(
          'tipo_prova', prova_info.tipo,
          'is_binaria', prova_info.is_aposta_binaria
        )
      );

      -- Verificar se subiu de nível
      SELECT
        FLOOR(pontos_totais / 100)
      INTO nivel_antigo
      FROM profiles
      WHERE id = NEW.user_id;

      -- Calcular novo nível após ganhar pontos
      nivel_novo := FLOOR((
        SELECT pontos_totais + pontos_ganhos
        FROM profiles
        WHERE id = NEW.user_id
      ) / 100);

      -- Se subiu de nível, criar notificação adicional
      IF nivel_novo > nivel_antigo THEN
        INSERT INTO notificacoes (
          user_id,
          tipo,
          titulo,
          mensagem,
          pontos,
          metadata
        ) VALUES (
          NEW.user_id,
          'nivel_up',
          '🎊 Level UP!',
          'Parabéns! Você subiu para o nível ' || nivel_novo || '!',
          NULL,
          jsonb_build_object('nivel', nivel_novo)
        );
      END IF;
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para notificações de pontos
DROP TRIGGER IF EXISTS trigger_criar_notificacao_pontos ON apostas;
CREATE TRIGGER trigger_criar_notificacao_pontos
  AFTER UPDATE ON apostas
  FOR EACH ROW
  EXECUTE FUNCTION criar_notificacao_pontos();

-- ============================================================================
-- FUNÇÃO: Limpar notificações antigas (manter últimas 50 por usuário)
-- ============================================================================

CREATE OR REPLACE FUNCTION limpar_notificacoes_antigas()
RETURNS void AS $$
BEGIN
  DELETE FROM notificacoes
  WHERE id IN (
    SELECT id
    FROM (
      SELECT
        id,
        ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
      FROM notificacoes
    ) sub
    WHERE rn > 50
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================

SELECT '✅ Tabela de notificações criada com sucesso!' AS status;
SELECT 'Execute "SELECT * FROM notificacoes;" para ver notificações' AS dica;
