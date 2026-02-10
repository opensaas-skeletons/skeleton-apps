// ---- Entity Types ----

export interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  company_id: string | null;
  title: string | null;
  source: string;
  notes: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  // Joined fields
  company_name?: string;
}

export interface Company {
  id: string;
  name: string;
  domain: string | null;
  industry: string | null;
  size: string | null;
  address: string;
  notes: string;
  created_at: string;
  updated_at: string;
  // Computed
  contact_count?: number;
  deal_count?: number;
}

export interface Pipeline {
  id: string;
  title: string;
  description: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  stages?: Stage[];
}

export interface Stage {
  id: string;
  pipeline_id: string;
  title: string;
  position: number;
  probability: number;
  is_terminal: boolean;
  terminal_state: string | null;
  color: string;
  created_at: string;
  // Computed
  deals?: Deal[];
  deal_count?: number;
  total_value?: number;
}

export interface Deal {
  id: string;
  title: string;
  value: number;
  currency: string;
  stage_id: string;
  pipeline_id: string;
  contact_id: string | null;
  company_id: string | null;
  status: string;
  close_date: string | null;
  expected_close_date: string | null;
  lost_reason: string | null;
  position: number;
  notes: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  contact_name?: string;
  company_name?: string;
  stage_title?: string;
}

export interface Activity {
  id: string;
  type: string;
  title: string;
  description: string;
  contact_id: string | null;
  deal_id: string | null;
  company_id: string | null;
  due_date: string | null;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  contact_name?: string;
  deal_title?: string;
  company_name?: string;
}

// ---- Input Types ----

export interface CreateContactInput {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  company_id?: string;
  title?: string;
  source?: string;
  notes?: string;
  tags?: string[];
}

export interface UpdateContactInput {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  company_id?: string | null;
  title?: string;
  source?: string;
  notes?: string;
  tags?: string[];
}

export interface CreateCompanyInput {
  name: string;
  domain?: string;
  industry?: string;
  size?: string;
  address?: string;
  notes?: string;
}

export interface UpdateCompanyInput {
  name?: string;
  domain?: string;
  industry?: string;
  size?: string;
  address?: string;
  notes?: string;
}

export interface CreatePipelineInput {
  title: string;
  description?: string;
  is_default?: boolean;
  stages?: CreateStageInput[];
}

export interface UpdatePipelineInput {
  title?: string;
  description?: string;
  is_default?: boolean;
}

export interface CreateStageInput {
  title: string;
  position?: number;
  probability?: number;
  is_terminal?: boolean;
  terminal_state?: string | null;
  color?: string;
}

export interface UpdateStageInput {
  title?: string;
  position?: number;
  probability?: number;
  is_terminal?: boolean;
  terminal_state?: string | null;
  color?: string;
}

export interface CreateDealInput {
  title: string;
  value?: number;
  currency?: string;
  stage_id: string;
  pipeline_id: string;
  contact_id?: string;
  company_id?: string;
  expected_close_date?: string;
  notes?: string;
}

export interface UpdateDealInput {
  title?: string;
  value?: number;
  currency?: string;
  stage_id?: string;
  contact_id?: string | null;
  company_id?: string | null;
  status?: string;
  close_date?: string | null;
  expected_close_date?: string | null;
  lost_reason?: string | null;
  notes?: string;
}

export interface MoveDealInput {
  stage_id: string;
  position: number;
}

export interface CreateActivityInput {
  type: string;
  title: string;
  description?: string;
  contact_id?: string;
  deal_id?: string;
  company_id?: string;
  due_date?: string;
}

export interface UpdateActivityInput {
  type?: string;
  title?: string;
  description?: string;
  contact_id?: string | null;
  deal_id?: string | null;
  company_id?: string | null;
  due_date?: string | null;
  completed?: boolean;
}

// ---- Response Types ----

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  code?: string;
}

// ---- Dashboard Types ----

export interface DashboardSummary {
  total_contacts: number;
  total_companies: number;
  total_deals: number;
  open_deals: number;
  won_deals: number;
  lost_deals: number;
  total_pipeline_value: number;
  weighted_pipeline_value: number;
}

export interface PipelineFunnelEntry {
  stage_id: string;
  stage_title: string;
  position: number;
  color: string;
  deal_count: number;
  total_value: number;
}

export interface ActivitySummary {
  type: string;
  count: number;
}

export interface RecentDeal {
  id: string;
  title: string;
  value: number;
  status: string;
  stage_title: string;
  contact_name: string | null;
  company_name: string | null;
  updated_at: string;
}

export interface WinRateEntry {
  month: string;
  won: number;
  lost: number;
  win_rate: number;
}

// ---- Interop Types ----

export interface CrmExportPayload {
  version: "1.0";
  exported_at: string;
  source: string;
  companies: CompanyExport[];
  contacts: ContactExport[];
  pipelines: PipelineExport[];
  deals: DealExport[];
  activities: ActivityExport[];
}

export interface CompanyExport {
  name: string;
  domain: string | null;
  industry: string | null;
  size: string | null;
  address: string;
  notes: string;
}

export interface ContactExport {
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  title: string | null;
  company_name: string | null;
  source: string;
  notes: string;
  tags: string[];
}

export interface PipelineExport {
  title: string;
  description: string;
  is_default: boolean;
  stages: StageExport[];
}

export interface StageExport {
  title: string;
  position: number;
  probability: number;
  is_terminal: boolean;
  terminal_state: string | null;
  color: string;
}

export interface DealExport {
  title: string;
  value: number;
  currency: string;
  status: string;
  pipeline_title: string;
  stage_title: string;
  contact_email: string | null;
  company_name: string | null;
  close_date: string | null;
  expected_close_date: string | null;
  lost_reason: string | null;
  notes: string;
}

export interface ActivityExport {
  type: string;
  title: string;
  description: string;
  contact_email: string | null;
  deal_title: string | null;
  company_name: string | null;
  due_date: string | null;
  completed: boolean;
  completed_at: string | null;
}
