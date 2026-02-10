import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import * as contactService from "../services/contact.service";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const contacts = await contactService.listContacts({
      search: req.query.search as string,
      company_id: req.query.company_id as string,
      source: req.query.source as string,
      sort_by: req.query.sort_by as string,
      sort_order: req.query.sort_order as string,
    });
    res.json({ success: true, data: contacts });
  } catch (err) { next(err); }
});

router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const contact = await contactService.getContact(req.params.id);
    res.json({ success: true, data: contact });
  } catch (err) { next(err); }
});

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const contact = await contactService.createContact(req.body);
    res.status(201).json({ success: true, data: contact });
  } catch (err) { next(err); }
});

router.put("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const contact = await contactService.updateContact(req.params.id, req.body);
    res.json({ success: true, data: contact });
  } catch (err) { next(err); }
});

router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    await contactService.deleteContact(req.params.id);
    res.json({ success: true, data: null });
  } catch (err) { next(err); }
});

// CSV Import
router.post("/import", upload.single("file"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "No file uploaded" });
    }

    const content = req.file.buffer.toString("utf-8");
    const lines = content.split("\n").filter((l) => l.trim());
    if (lines.length < 2) {
      return res.status(400).json({ success: false, error: "CSV must have a header row and at least one data row" });
    }

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const rows: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => { row[h] = values[idx] || ""; });
      rows.push(row);
    }

    const result = await contactService.importContacts(rows);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

export default router;
