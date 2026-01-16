-- ==============================================================================
-- INSTRUÇÕES DE USO:
-- 1. Copie todo o código abaixo.
-- 2. Vá no Painel do Supabase (https://supabase.com/dashboard).
-- 3. Entre no seu projeto -> SQL Editor.
-- 4. Cole o código e clique em "RUN".
-- ==============================================================================

-- 1. Criação da Tabela (Caso ainda não exista)
CREATE TABLE IF NOT EXISTS members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  full_name TEXT NOT NULL,
  birth_date DATE NOT NULL,
  cpf TEXT NOT NULL,
  rg TEXT NOT NULL,
  role TEXT NOT NULL,
  issue_date DATE,
  locality TEXT DEFAULT 'Frei Fabiano',
  baptism_date DATE,
  access_code TEXT,
  photo_url TEXT, -- Armazena Base64 (Texto longo)
  
  -- Campos de Endereço (Novos)
  street TEXT,
  number TEXT,
  zip_code TEXT,
  neighborhood TEXT,
  city TEXT
);

-- 2. Atualização da Tabela (Caso ela já exista, adiciona as colunas que faltam)
-- O 'IF NOT EXISTS' garante que não dê erro se você rodar mais de uma vez.
ALTER TABLE members ADD COLUMN IF NOT EXISTS street text;
ALTER TABLE members ADD COLUMN IF NOT EXISTS number text;
ALTER TABLE members ADD COLUMN IF NOT EXISTS zip_code text;
ALTER TABLE members ADD COLUMN IF NOT EXISTS neighborhood text;
ALTER TABLE members ADD COLUMN IF NOT EXISTS city text;

-- 3. Habilitar Row Level Security (Segurança)
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de Acesso (Permite tudo para Anon/Public por enquanto, conforme chave anon usada)
-- Nota: Em produção real, você restringiria isso, mas para o App funcionar agora:
CREATE POLICY "Enable all access for all users" ON members
FOR ALL USING (true) WITH CHECK (true);