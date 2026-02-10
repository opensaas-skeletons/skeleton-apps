import { getPool } from "./connection";
import { v4 as uuidv4 } from "uuid";
import { DEFAULT_PIPELINE_STAGES } from "@shared/constants";

async function seed() {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    console.log("Seeding database...");

    // ---- Companies ----
    const companyIds = {
      acme: uuidv4(),
      globex: uuidv4(),
      initech: uuidv4(),
      umbrella: uuidv4(),
      stark: uuidv4(),
    };

    for (const [id, name, domain, industry, size, address, notes] of [
      [companyIds.acme, "Acme Corp", "acme.com", "Manufacturing", "201-500", "123 Industrial Blvd, Chicago, IL", "Long-standing customer with multiple divisions"],
      [companyIds.globex, "Globex Inc", "globex.com", "Technology", "51-200", "456 Tech Park, San Jose, CA", "Fast-growing SaaS company"],
      [companyIds.initech, "Initech", "initech.com", "Consulting", "51-200", "789 Corporate Dr, Austin, TX", "Enterprise consulting firm"],
      [companyIds.umbrella, "Umbrella Corp", "umbrella.co", "Healthcare", "500+", "321 Pharma Way, Boston, MA", "Large pharma company, multiple stakeholders"],
      [companyIds.stark, "Stark Industries", "stark.io", "Technology", "11-50", "555 Innovation Ave, Palo Alto, CA", "AI/ML startup with strong funding"],
    ] as const) {
      await client.query(
        "INSERT INTO companies (id, name, domain, industry, size, address, notes) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [id, name, domain, industry, size, address, notes]
      );
    }
    console.log("  Companies seeded");

    // ---- Contacts ----
    const contactIds = {
      jsmith: uuidv4(),
      lchen: uuidv4(),
      mgarcia: uuidv4(),
      sjohnson: uuidv4(),
      abrown: uuidv4(),
      kwilson: uuidv4(),
      dmiller: uuidv4(),
      jtaylor: uuidv4(),
      randerson: uuidv4(),
      ethomas: uuidv4(),
    };

    const contactData: [string, string, string, string, string, string, string, string, string, string][] = [
      [contactIds.jsmith, "John", "Smith", "john.smith@acme.com", "+1-312-555-0101", companyIds.acme, "VP of Operations", "referral", "Key decision maker", '["vip","decision-maker"]'],
      [contactIds.lchen, "Lisa", "Chen", "lisa.chen@acme.com", "+1-312-555-0102", companyIds.acme, "Procurement Manager", "website", "Handles purchasing approvals", '["procurement"]'],
      [contactIds.mgarcia, "Marco", "Garcia", "marco.garcia@globex.com", "+1-408-555-0201", companyIds.globex, "CTO", "linkedin", "Technical evaluator", '["technical","decision-maker"]'],
      [contactIds.sjohnson, "Sarah", "Johnson", "sarah.j@globex.com", "+1-408-555-0202", companyIds.globex, "Engineering Manager", "referral", "Reports to Marco", '["technical"]'],
      [contactIds.abrown, "Alex", "Brown", "alex.brown@initech.com", "+1-512-555-0301", companyIds.initech, "Managing Director", "manual", "Met at conference", '["decision-maker"]'],
      [contactIds.kwilson, "Karen", "Wilson", "karen.w@initech.com", "+1-512-555-0302", companyIds.initech, "Senior Consultant", "website", "Champions our solution internally", '["champion"]'],
      [contactIds.dmiller, "David", "Miller", "david.m@umbrella.co", "+1-617-555-0401", companyIds.umbrella, "Head of IT", "linkedin", "Budget holder for IT projects", '["decision-maker","it"]'],
      [contactIds.jtaylor, "Jennifer", "Taylor", "jen.taylor@umbrella.co", "+1-617-555-0402", companyIds.umbrella, "Project Manager", "manual", "Day-to-day contact for implementation", '["implementation"]'],
      [contactIds.randerson, "Robert", "Anderson", "r.anderson@stark.io", "+1-650-555-0501", companyIds.stark, "CEO", "referral", "Founder, very hands-on", '["vip","decision-maker"]'],
      [contactIds.ethomas, "Emily", "Thomas", "emily.t@stark.io", "+1-650-555-0502", companyIds.stark, "Head of Product", "linkedin", "Evaluates product fit", '["product","technical"]'],
    ];
    for (const [id, fn, ln, email, phone, compId, title, source, notes, tags] of contactData) {
      await client.query(
        "INSERT INTO contacts (id, first_name, last_name, email, phone, company_id, title, source, notes, tags) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)",
        [id, fn, ln, email, phone, compId, title, source, notes, tags]
      );
    }
    console.log("  Contacts seeded");

    // ---- Pipelines & Stages ----
    const salesPipelineId = uuidv4();
    const partnerPipelineId = uuidv4();

    await client.query("INSERT INTO pipelines (id, title, description, is_default) VALUES ($1, $2, $3, $4)", [salesPipelineId, "Sales Pipeline", "Main sales pipeline for tracking deals", true]);
    await client.query("INSERT INTO pipelines (id, title, description, is_default) VALUES ($1, $2, $3, $4)", [partnerPipelineId, "Partnership Pipeline", "Pipeline for partnership and channel deals", false]);

    // Sales Pipeline stages from DEFAULT_PIPELINE_STAGES
    const salesStageIds: Record<string, string> = {};
    for (let i = 0; i < DEFAULT_PIPELINE_STAGES.length; i++) {
      const s = DEFAULT_PIPELINE_STAGES[i];
      const stageId = uuidv4();
      const key = s.title.toLowerCase().replace(/\s+/g, "_");
      salesStageIds[key] = stageId;
      await client.query(
        "INSERT INTO stages (id, pipeline_id, title, position, probability, is_terminal, terminal_state, color) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
        [stageId, salesPipelineId, s.title, i, s.probability, s.is_terminal, s.terminal_state, s.color]
      );
    }

    // Partnership Pipeline stages
    const partnerStages = [
      { title: "Inquiry", probability: 20, is_terminal: false, terminal_state: null, color: "#94a3b8" },
      { title: "Evaluation", probability: 50, is_terminal: false, terminal_state: null, color: "#3b82f6" },
      { title: "Agreement", probability: 80, is_terminal: false, terminal_state: null, color: "#f59e0b" },
      { title: "Active", probability: 100, is_terminal: true, terminal_state: "won", color: "#22c55e" },
    ];
    const partnerStageIds: Record<string, string> = {};
    for (let i = 0; i < partnerStages.length; i++) {
      const s = partnerStages[i];
      const stageId = uuidv4();
      partnerStageIds[s.title.toLowerCase()] = stageId;
      await client.query(
        "INSERT INTO stages (id, pipeline_id, title, position, probability, is_terminal, terminal_state, color) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
        [stageId, partnerPipelineId, s.title, i, s.probability, s.is_terminal, s.terminal_state, s.color]
      );
    }
    console.log("  Pipelines & stages seeded");

    // ---- Deals ----
    const dealIds = {
      acmeEnterprise: uuidv4(),
      globexPlatform: uuidv4(),
      initechConsulting: uuidv4(),
      umbrellaIt: uuidv4(),
      starkAi: uuidv4(),
      acmeExpansion: uuidv4(),
      globexSupport: uuidv4(),
      umbrellaLost: uuidv4(),
    };

    const dealData: [string, string, number, string, string, string, string, string, string, string | null, string | null, string | null, number, string][] = [
      [dealIds.acmeEnterprise, "Acme Enterprise License", 75000, "USD", salesStageIds["negotiation"], salesPipelineId, contactIds.jsmith, companyIds.acme, "open", null, "2026-04-15", null, 0, "Enterprise license for 200 seats"],
      [dealIds.globexPlatform, "Globex Platform Integration", 120000, "USD", salesStageIds["proposal"], salesPipelineId, contactIds.mgarcia, companyIds.globex, "open", null, "2026-05-01", null, 0, "Full platform integration with their tech stack"],
      [dealIds.initechConsulting, "Initech Consulting Package", 45000, "USD", salesStageIds["qualified"], salesPipelineId, contactIds.abrown, companyIds.initech, "open", null, "2026-03-20", null, 0, "Consulting services package"],
      [dealIds.umbrellaIt, "Umbrella IT Modernization", 250000, "USD", salesStageIds["lead"], salesPipelineId, contactIds.dmiller, companyIds.umbrella, "open", null, "2026-06-30", null, 0, "Large IT modernization project"],
      [dealIds.starkAi, "Stark AI Module", 95000, "USD", salesStageIds["closed_won"], salesPipelineId, contactIds.randerson, companyIds.stark, "won", "2026-01-15", "2026-02-01", null, 0, "AI/ML module deal - closed early"],
      [dealIds.acmeExpansion, "Acme Division Expansion", 35000, "USD", salesStageIds["lead"], salesPipelineId, contactIds.jsmith, companyIds.acme, "open", null, "2026-03-01", null, 1, "Expanding to manufacturing division"],
      [dealIds.globexSupport, "Globex Annual Support", 28000, "USD", salesStageIds["closed_won"], salesPipelineId, contactIds.mgarcia, companyIds.globex, "won", "2026-01-20", "2026-01-31", null, 1, "Annual support contract renewed"],
      [dealIds.umbrellaLost, "Umbrella Phase 1 Pilot", 15000, "USD", salesStageIds["closed_lost"], salesPipelineId, contactIds.dmiller, companyIds.umbrella, "lost", "2026-01-10", "2026-01-15", "Budget constraints in Q1", 0, "Initial pilot program - lost to budget cuts"],
    ];
    for (const [id, title, value, currency, stageId, pipelineId, contactId, companyId, status, closeDate, expectedClose, lostReason, position, notes] of dealData) {
      await client.query(
        `INSERT INTO deals (id, title, value, currency, stage_id, pipeline_id, contact_id, company_id, status, close_date, expected_close_date, lost_reason, position, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [id, title, value, currency, stageId, pipelineId, contactId, companyId, status, closeDate, expectedClose, lostReason, position, notes]
      );
    }
    console.log("  Deals seeded");

    // ---- Activities ----
    const activityData: [string, string, string, string, string, string, string | null, boolean, string | null][] = [
      ["call", "Discovery call with John Smith", "Initial discovery call to understand Acme requirements", contactIds.jsmith, dealIds.acmeEnterprise, companyIds.acme, "2026-01-10 10:00:00", true, "2026-01-10 10:45:00"],
      ["email", "Send proposal to Acme", "Follow up with enterprise license proposal document", contactIds.jsmith, dealIds.acmeEnterprise, companyIds.acme, "2026-01-12 09:00:00", true, "2026-01-12 09:30:00"],
      ["meeting", "Technical demo for Globex", "Live demo of platform integration capabilities", contactIds.mgarcia, dealIds.globexPlatform, companyIds.globex, "2026-01-15 14:00:00", true, "2026-01-15 15:30:00"],
      ["call", "Follow up with Marco on integration", "Discuss technical requirements and timeline", contactIds.mgarcia, dealIds.globexPlatform, companyIds.globex, "2026-01-20 11:00:00", true, "2026-01-20 11:30:00"],
      ["email", "Send SOW to Initech", "Statement of Work for consulting package", contactIds.abrown, dealIds.initechConsulting, companyIds.initech, "2026-01-22 09:00:00", true, "2026-01-22 10:00:00"],
      ["meeting", "Quarterly review with Umbrella", "Review project scope and timeline for IT modernization", contactIds.dmiller, dealIds.umbrellaIt, companyIds.umbrella, "2026-02-01 13:00:00", false, null],
      ["task", "Prepare contract for Stark AI", "Draft final contract terms for AI module", contactIds.randerson, dealIds.starkAi, companyIds.stark, "2026-01-14 17:00:00", true, "2026-01-14 16:00:00"],
      ["note", "Competitive intel from Karen", "Karen mentioned competitor is also pitching to Initech board", contactIds.kwilson, dealIds.initechConsulting, companyIds.initech, null, false, null],
      ["call", "Negotiation call with Acme", "Final pricing negotiation for enterprise deal", contactIds.jsmith, dealIds.acmeEnterprise, companyIds.acme, "2026-02-05 10:00:00", false, null],
      ["email", "Send updated pricing to Globex", "Updated pricing based on expanded scope", contactIds.mgarcia, dealIds.globexPlatform, companyIds.globex, "2026-02-03 09:00:00", false, null],
      ["meeting", "Stakeholder meeting at Umbrella", "Meet with IT and procurement teams", contactIds.jtaylor, dealIds.umbrellaIt, companyIds.umbrella, "2026-02-10 10:00:00", false, null],
      ["task", "Update CRM with Stark deal details", "Record final deal terms and implementation plan", contactIds.randerson, dealIds.starkAi, companyIds.stark, "2026-01-16 12:00:00", true, "2026-01-16 11:00:00"],
      ["call", "Check in with Alex Brown", "Monthly check-in on consulting engagement", contactIds.abrown, dealIds.initechConsulting, companyIds.initech, "2026-02-15 11:00:00", false, null],
      ["email", "Welcome email to Emily", "Introduce implementation team for Stark AI project", contactIds.ethomas, dealIds.starkAi, companyIds.stark, "2026-01-17 09:00:00", true, "2026-01-17 09:15:00"],
      ["note", "Budget update from David", "David confirmed Q2 budget includes IT modernization allocation", contactIds.dmiller, dealIds.umbrellaIt, companyIds.umbrella, null, false, null],
    ];
    for (const [type, title, description, contactId, dealId, companyId, dueDate, completed, completedAt] of activityData) {
      await client.query(
        `INSERT INTO activities (id, type, title, description, contact_id, deal_id, company_id, due_date, completed, completed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [uuidv4(), type, title, description, contactId, dealId, companyId, dueDate, completed, completedAt]
      );
    }
    console.log("  Activities seeded");

    await client.query("COMMIT");
    console.log("Database seeded successfully!");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Seed failed:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
