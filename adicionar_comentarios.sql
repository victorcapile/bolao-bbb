-- Cria tabela de comentários para o feed
CREATE TABLE IF NOT EXISTS public.feed_comentarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  atividade_id UUID REFERENCES public.feed_atividades(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.auth.users(id) ON DELETE CASCADE,
  texto TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.feed_comentarios ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Qualquer um pode ver comentários" 
  ON public.feed_comentarios FOR SELECT 
  USING (true);

CREATE POLICY "Usuários autenticados podem comentar" 
  ON public.feed_comentarios FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus comentários" 
  ON public.feed_comentarios FOR DELETE 
  USING (auth.uid() = user_id);
