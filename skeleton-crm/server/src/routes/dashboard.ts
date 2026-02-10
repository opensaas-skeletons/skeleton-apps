import { Router, Request, Response, NextFunction } from "express";
import { query } from "../db/connection";
import type { DashboardSummary, PipelineFunnelEntry, ActivitySummary, RecentDeal, WinRateEntry } from "@shared/types/crm";

const router = Router();

router.get("/summary", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [contacts] = await query<{ count: number }>("SELECT COUNT(*)::int as count FROM contacts");
    const [companies] = await query<{ count: number }>("SELECT COUNT(*)::int as count FROM companies");
    const [deals] = await query<{ count: number }>("SELECT COUNT(*)::int as count FROM deals");
    const [openDeals] = await query<{ count: number }>("SELECT COUNT(*)::int as count FROM deals WHERE status = 'open'");
    const [wonDeals] = await query<{ count: number }>("SELECT COUNT(*)::int as count FROM deals WHERE status = 'won'");
    const [lostDeals] = await query<{ count: number }>("SELECT COUNT(*)::int as count FROM deals WHERE status = 'lost'");
    const [pipelineValue] = await query<{ total: number }>("SELECT COALESCE(SUM(value), 0)::float as total FROM deals WHERE status = 'open'");
    const [weightedValue] = await query<{ total: number }>(
      `SELECT COALESCE(SUM(d.value * s.probability / 100.0), 0)::float as total
       FROM deals d JOIN stages s ON d.stage_id = s.id WHERE d.status = 'open'`
    );

    const summary: DashboardSummary = {
      total_contacts: contacts.count,
      total_companies: companies.count,
      total_deals: deals.count,
      open_deals: openDeals.count,
      won_deals: wonDeals.count,
      lost_deals: lostDeals.count,
      total_pipeline_value: pipelineValue.total,
      weighted_pipeline_value: weightedValue.total,
    };

    res.json({ success: true, data: summary });
  } catch (err) { next(err); }
});

router.get("/pipeline-funnel", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pipelineId = req.query.pipeline_id as string;
    if (!pipelineId) {
      return res.status(400).json({ success: false, error: "pipeline_id is required" });
    }

    const funnel = await query<PipelineFunnelEntry>(
      `SELECT s.id as stage_id, s.title as stage_title, s.position, s.color,
        COUNT(d.id)::int as deal_count,
        COALESCE(SUM(d.value), 0)::float as total_value
       FROM stages s
       LEFT JOIN deals d ON d.stage_id = s.id AND d.status = 'open'
       WHERE s.pipeline_id = $1
       GROUP BY s.id, s.title, s.position, s.color
       ORDER BY s.position ASC`,
      [pipelineId]
    );

    res.json({ success: true, data: funnel });
  } catch (err) { next(err); }
});

router.get("/activity-summary", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const summary = await query<ActivitySummary>(
      `SELECT type, COUNT(*)::int as count
       FROM activities
       WHERE created_at >= NOW() - INTERVAL '30 days'
       GROUP BY type ORDER BY count DESC`
    );
    res.json({ success: true, data: summary });
  } catch (err) { next(err); }
});

router.get("/recent-deals", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const deals = await query<RecentDeal>(
      `SELECT d.id, d.title, d.value::float, d.status, s.title as stage_title,
        CONCAT(c.first_name, ' ', c.last_name) as contact_name,
        co.name as company_name, d.updated_at
       FROM deals d
       LEFT JOIN stages s ON d.stage_id = s.id
       LEFT JOIN contacts c ON d.contact_id = c.id
       LEFT JOIN companies co ON d.company_id = co.id
       ORDER BY d.updated_at DESC LIMIT 10`
    );
    res.json({ success: true, data: deals });
  } catch (err) { next(err); }
});

router.get("/win-rate", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const rates = await query<WinRateEntry>(
      `SELECT
        TO_CHAR(close_date, 'YYYY-MM') as month,
        COUNT(*) FILTER (WHERE status = 'won')::int as won,
        COUNT(*) FILTER (WHERE status = 'lost')::int as lost,
        CASE
          WHEN COUNT(*) FILTER (WHERE status IN ('won', 'lost')) > 0
          THEN ROUND(COUNT(*) FILTER (WHERE status = 'won')::numeric / COUNT(*) FILTER (WHERE status IN ('won', 'lost'))::numeric * 100, 1)::float
          ELSE 0
        END as win_rate
       FROM deals
       WHERE close_date IS NOT NULL AND status IN ('won', 'lost')
       GROUP BY TO_CHAR(close_date, 'YYYY-MM')
       ORDER BY month DESC LIMIT 12`
    );
    res.json({ success: true, data: rates });
  } catch (err) { next(err); }
});

export default router;
