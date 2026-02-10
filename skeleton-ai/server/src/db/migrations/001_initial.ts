export const up = `
  CREATE EXTENSION IF NOT EXISTS vector;
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

  -- Sources table
  CREATE TABLE IF NOT EXISTS sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    description TEXT DEFAULT '',
    source_type VARCHAR(20) NOT NULL CHECK (source_type IN ('directory', 'url')),
    config JSONB NOT NULL DEFAULT '{}',
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'ingesting', 'ready', 'error')),
    document_count INT DEFAULT 0,
    chunk_count INT DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Documents table
  CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    file_type VARCHAR(50),
    content_hash VARCHAR(64),
    chunk_count INT DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Chunks table
  CREATE TABLE IF NOT EXISTS chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    chunk_index INT NOT NULL,
    metadata JSONB DEFAULT '{}',
    embedding vector(768),
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Conversations table
  CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) DEFAULT 'New Conversation',
    model VARCHAR(100),
    provider VARCHAR(50),
    message_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Messages table
  CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    sources JSONB,
    model VARCHAR(100),
    tokens_used INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Settings table
  CREATE TABLE IF NOT EXISTS settings (
    key VARCHAR(255) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Indexes
  CREATE INDEX IF NOT EXISTS idx_documents_source_id ON documents(source_id);
  CREATE INDEX IF NOT EXISTS idx_chunks_document_id ON chunks(document_id);
  CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);

  -- IVFFlat vector index for cosine similarity search
  CREATE INDEX IF NOT EXISTS idx_chunks_embedding ON chunks
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

  -- Updated_at trigger function
  CREATE OR REPLACE FUNCTION update_updated_at()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  -- Apply triggers
  DROP TRIGGER IF EXISTS trigger_sources_updated_at ON sources;
  CREATE TRIGGER trigger_sources_updated_at
    BEFORE UPDATE ON sources FOR EACH ROW EXECUTE FUNCTION update_updated_at();

  DROP TRIGGER IF EXISTS trigger_documents_updated_at ON documents;
  CREATE TRIGGER trigger_documents_updated_at
    BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at();

  DROP TRIGGER IF EXISTS trigger_conversations_updated_at ON conversations;
  CREATE TRIGGER trigger_conversations_updated_at
    BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
`;
