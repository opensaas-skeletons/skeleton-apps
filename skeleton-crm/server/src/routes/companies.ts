import { Router, Request, Response, NextFunction } from "express";
import * as companyService from "../services/company.service";

const router = Router();

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companies = await companyService.listCompanies({
      search: req.query.search as string,
      industry: req.query.industry as string,
      size: req.query.size as string,
      sort_by: req.query.sort_by as string,
      sort_order: req.query.sort_order as string,
    });
    res.json({ success: true, data: companies });
  } catch (err) { next(err); }
});

router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const company = await companyService.getCompany(req.params.id);
    res.json({ success: true, data: company });
  } catch (err) { next(err); }
});

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const company = await companyService.createCompany(req.body);
    res.status(201).json({ success: true, data: company });
  } catch (err) { next(err); }
});

router.put("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const company = await companyService.updateCompany(req.params.id, req.body);
    res.json({ success: true, data: company });
  } catch (err) { next(err); }
});

router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    await companyService.deleteCompany(req.params.id);
    res.json({ success: true, data: null });
  } catch (err) { next(err); }
});

export default router;
