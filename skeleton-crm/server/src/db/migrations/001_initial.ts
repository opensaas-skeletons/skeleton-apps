export const up = `
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(500) NOT NULL,
  domain VARCHAR(500),
  industry VARCHAR(255),
  size VARCHAR(50),
  address TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(500),
  phone VARCHAR(50),
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  title VARCHAR(255),
  source VARCHAR(100) NOT NULL DEFAULT 'manual',
  notes TEXT NOT NULL DEFAULT '',
  tags JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pipelines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pipeline_id UUID NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  probability INTEGER NOT NULL DEFAULT 0,
  is_terminal BOOLEAN NOT NULL DEFAULT false,
  terminal_state VARCHAR(20),
  color VARCHAR(20) NOT NULL DEFAULT '#3b82f6',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(500) NOT NULL,
  value NUMERIC(15,2) NOT NULL DEFAULT 0,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  stage_id UUID NOT NULL REFERENCES stages(id) ON DELETE CASCADE,
  pipeline_id UUID NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'open',
  close_date DATE,
  expected_close_date DATE,
  lost_reason TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(50) NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  due_date TIMESTAMPTZ,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_contacts_company_id ON contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_contacts_search ON contacts USING GIN (
  to_tsvector('english', first_name || ' ' || last_name || ' ' || COALESCE(email, ''))
);
CREATE INDEX IF NOT EXISTS idx_companies_search ON companies USING GIN (
  to_tsvector('english', name || ' ' || COALESCE(domain, ''))
);
CREATE INDEX IF NOT EXISTS idx_stages_pipeline_id ON stages(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_deals_pipeline_id ON deals(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage_id ON deals(stage_id);
CREATE INDEX IF NOT EXISTS idx_deals_contact_id ON deals(contact_id);
CREATE INDEX IF NOT EXISTS idx_deals_company_id ON deals(company_id);
CREATE INDEX IF NOT EXISTS idx_activities_contact_id ON activities(contact_id);
CREATE INDEX IF NOT EXISTS idx_activities_deal_id ON activities(deal_id);
CREATE INDEX IF NOT EXISTS idx_activities_company_id ON activities(company_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_contacts_updated_at ON contacts;
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_pipelines_updated_at ON pipelines;
CREATE TRIGGER update_pipelines_updated_at BEFORE UPDATE ON pipelines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_deals_updated_at ON deals;
CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON deals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_activities_updated_at ON activities;
CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON activities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;
