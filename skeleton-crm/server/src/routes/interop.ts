import { Router, Request, Response, NextFunction } from "express";
import { query, queryOne } from "../db/connection";
import { ValidationError } from "../errors";
import { APP_NAME, INTEROP_VERSION } from "@shared/constants";
import type {
  CrmExportPayload,
  CompanyExport,
  ContactExport,
  PipelineExport,
  DealExport,
  ActivityExport,
  Company,
  Contact,
  Pipeline,
  Stage,
  Deal,
  Activity,
} from "@shared/types/crm";

const router = Router();

router.get("/export", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const companies = await query<Company>("SELECT * FROM companies ORDER BY created_at ASC");
    const contacts = await query<Contact & { company_name: string | null }>(
      `SELECT c.*, co.name as company_name FROM contacts c LEFT JOIN companies co ON c.company_id = co.id ORDER BY c.created_at ASC`
    );
    const pipelines = await query<Pipeline>("SELECT * FROM pipelines ORDER BY created_at ASC");
    const stages = await query<Stage>("SELECT * FROM stages ORDER BY pipeline_id, position ASC");
    const deals = await query<Deal & { contact_email: string | null; company_name: string | null; pipeline_title: string; stage_title: string }>(
      `SELECT d.*, c.email as contact_email, co.name as company_name, p.title as pipeline_title, s.title as stage_title
       FROM deals d
       LEFT JOIN contacts c ON d.contact_id = c.id
       LEFT JOIN companies co ON d.company_id = co.id
       LEFT JOIN pipelines p ON d.pipeline_id = p.id
       LEFT JOIN stages s ON d.stage_id = s.id
       ORDER BY d.created_at ASC`
    );
    const activities = await query<Activity & { contact_email: string | null; deal_title: string | null; company_name: string | null }>(
      `SELECT a.*, c.email as contact_email, d.title as deal_title, co.name as company_name
       FROM activities a
       LEFT JOIN contacts c ON a.contact_id = c.id
       LEFT JOIN deals d ON a.deal_id = d.id
       LEFT JOIN companies co ON a.company_id = co.id
       ORDER BY a.created_at ASC`
    );

    // Build pipeline exports with stages
    const pipelineMap = new Map<string, Stage[]>();
    for (const stage of stages) {
      if (!pipelineMap.has(stage.pipeline_id)) pipelineMap.set(stage.pipeline_id, []);
      pipelineMap.get(stage.pipeline_id)!.push(stage);
    }

    const payload: CrmExportPayload = {
      version: INTEROP_VERSION as "1.0",
      exported_at: new Date().toISOString(),
      source: APP_NAME,
      companies: companies.map((c): CompanyExport => ({
        name: c.name, domain: c.domain, industry: c.industry, size: c.size, address: c.address, notes: c.notes,
      })),
      contacts: contacts.map((c): ContactExport => ({
        first_name: c.first_name, last_name: c.last_name, email: c.email, phone: c.phone,
        title: c.title, company_name: c.company_name, source: c.source, notes: c.notes, tags: c.tags,
      })),
      pipelines: pipelines.map((p): PipelineExport => ({
        title: p.title, description: p.description, is_default: p.is_default,
        stages: (pipelineMap.get(p.id) || []).map((s) => ({
          title: s.title, position: s.position, probability: s.probability,
          is_terminal: s.is_terminal, terminal_state: s.terminal_state, color: s.color,
        })),
      })),
      deals: deals.map((d): DealExport => ({
        title: d.title, value: d.value, currency: d.currency, status: d.status,
        pipeline_title: d.pipeline_title, stage_title: d.stage_title,
        contact_email: d.contact_email, company_name: d.company_name,
        close_date: d.close_date, expected_close_date: d.expected_close_date,
        lost_reason: d.lost_reason, notes: d.notes,
      })),
      activities: activities.map((a): ActivityExport => ({
        type: a.type, title: a.title, description: a.description,
        contact_email: a.contact_email, deal_title: a.deal_title, company_name: a.company_name,
        due_date: a.due_date, completed: a.completed, completed_at: a.completed_at,
      })),
    };

    res.json(payload);
  } catch (err) { next(err); }
});

router.post("/import", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = req.body as CrmExportPayload;

    if (!payload.version) throw new ValidationError("Invalid import payload. Expected { version, ... }.");
    if (payload.version !== "1.0") throw new ValidationError(`Unsupported interop version: ${payload.version}. Expected 1.0.`);

    let importedCompanies = 0, importedContacts = 0, importedPipelines = 0, importedDeals = 0, importedActivities = 0;

    // Pass 1: Companies
    const companyNameToId = new Map<string, string>();
    if (payload.companies) {
      for (const c of payload.companies) {
        if (!c.name) continue;
        const existing = await queryOne<{ id: string }>("SELECT id FROM companies WHERE LOWER(name) = LOWER($1)", [c.name]);
        if (existing) {
          companyNameToId.set(c.name.toLowerCase(), existing.id);
        } else {
          const result = await queryOne<{ id: string }>(
            `INSERT INTO companies (name, domain, industry, size, address, notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
            [c.name, c.domain || null, c.industry || null, c.size || null, c.address || "", c.notes || ""]
          );
          companyNameToId.set(c.name.toLowerCase(), result!.id);
          importedCompanies++;
        }
      }
    }

    // Pass 2: Contacts
    const contactEmailToId = new Map<string, string>();
    if (payload.contacts) {
      for (const c of payload.contacts) {
        if (!c.first_name || !c.last_name) continue;
        const companyId = c.company_name ? companyNameToId.get(c.company_name.toLowerCase()) || null : null;
        const result = await queryOne<{ id: string }>(
          `INSERT INTO contacts (first_name, last_name, email, phone, title, company_id, source, notes, tags)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
          [c.first_name, c.last_name, c.email || null, c.phone || null, c.title || null, companyId, c.source || "import", c.notes || "", JSON.stringify(c.tags || [])]
        );
        if (c.email) contactEmailToId.set(c.email.toLowerCase(), result!.id);
        importedContacts++;
      }
    }

    // Pass 3: Pipelines + Stages
    const pipelineTitleToId = new Map<string, string>();
    const stageTitleToId = new Map<string, string>(); // key: "pipelineTitle::stageTitle"
    if (payload.pipelines) {
      for (const p of payload.pipelines) {
        if (!p.title) continue;
        const pResult = await queryOne<{ id: string }>(
          `INSERT INTO pipelines (title, description, is_default) VALUES ($1, $2, $3) RETURNING id`,
          [p.title, p.description || "", p.is_default || false]
        );
        pipelineTitleToId.set(p.title.toLowerCase(), pResult!.id);
        importedPipelines++;

        if (p.stages) {
          for (const s of p.stages) {
            const sResult = await queryOne<{ id: string }>(
              `INSERT INTO stages (pipeline_id, title, position, probability, is_terminal, terminal_state, color)
               VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
              [pResult!.id, s.title, s.position, s.probability, s.is_terminal, s.terminal_state || null, s.color || "#3b82f6"]
            );
            stageTitleToId.set(`${p.title.toLowerCase()}::${s.title.toLowerCase()}`, sResult!.id);
          }
        }
      }
    }

    // Pass 4: Deals
    const dealTitleToId = new Map<string, string>();
    if (payload.deals) {
      for (const d of payload.deals) {
        if (!d.title) continue;
        const pipelineId = d.pipeline_title ? pipelineTitleToId.get(d.pipeline_title.toLowerCase()) : null;
        const stageId = (d.pipeline_title && d.stage_title) ? stageTitleToId.get(`${d.pipeline_title.toLowerCase()}::${d.stage_title.toLowerCase()}`) : null;
        if (!pipelineId || !stageId) continue;
        const contactId = d.contact_email ? contactEmailToId.get(d.contact_email.toLowerCase()) || null : null;
        const companyId = d.company_name ? companyNameToId.get(d.company_name.toLowerCase()) || null : null;

        const result = await queryOne<{ id: string }>(
          `INSERT INTO deals (title, value, currency, status, pipeline_id, stage_id, contact_id, company_id, close_date, expected_close_date, lost_reason, notes, position)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id`,
          [d.title, d.value || 0, d.currency || "USD", d.status || "open", pipelineId, stageId, contactId, companyId, d.close_date || null, d.expected_close_date || null, d.lost_reason || null, d.notes || "", 0]
        );
        dealTitleToId.set(d.title.toLowerCase(), result!.id);
        importedDeals++;
      }
    }

    // Pass 5: Activities
    if (payload.activities) {
      for (const a of payload.activities) {
        if (!a.title || !a.type) continue;
        const contactId = a.contact_email ? contactEmailToId.get(a.contact_email.toLowerCase()) || null : null;
        const dealId = a.deal_title ? dealTitleToId.get(a.deal_title.toLowerCase()) || null : null;
        const companyId = a.company_name ? companyNameToId.get(a.company_name.toLowerCase()) || null : null;

        await queryOne(
          `INSERT INTO activities (type, title, description, contact_id, deal_id, company_id, due_date, completed, completed_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [a.type, a.title, a.description || "", contactId, dealId, companyId, a.due_date || null, a.completed || false, a.completed_at || null]
        );
        importedActivities++;
      }
    }

    res.json({
      success: true,
      data: { imported_companies: importedCompanies, imported_contacts: importedContacts, imported_pipelines: importedPipelines, imported_deals: importedDeals, imported_activities: importedActivities },
    });
  } catch (err) { next(err); }
});

export default router;
