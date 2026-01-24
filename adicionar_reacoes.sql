-- Cria tabela de reações para o feed
CREATE TABLE IF NOT EXISTS public.feed_reacoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  atividade_id UUID REFERENCES public.feed_atividades(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.auth.users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL, -- 'fire', 'clap', 'clown', 'snake'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(atividade_id, user_id, tipo)
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.feed_reacoes ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Qualquer um pode ver reações" 
  ON public.feed_reacoes FOR SELECT 
  USING (true);

CREATE POLICY "Usuários autenticados podem reagir" 
  ON public.feed_reacoes FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem remover suas reações" 
  ON public.feed_reacoes FOR DELETE 
  USING (auth.uid() = user_id);
