import { Router, Request, Response, NextFunction } from "express";
import * as notificationService from "../services/notification.service";
import { ValidationError } from "../errors";

const router = Router();

// GET /api/notifications
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const recipient = req.query.recipient as string;
    if (!recipient) throw new ValidationError("recipient query parameter is required");
    const unread_only = req.query.unread_only === "true";
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;
    const notifications = await notificationService.listNotifications(recipient, { unread_only, limit, offset });
    res.json({ success: true, data: notifications });
  } catch (err) { next(err); }
});

// GET /api/notifications/unread-count
router.get("/unread-count", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const recipient = req.query.recipient as string;
    if (!recipient) throw new ValidationError("recipient query parameter is required");
    const count = await notificationService.getUnreadCount(recipient);
    res.json({ success: true, data: { count } });
  } catch (err) { next(err); }
});

// PATCH /api/notifications/:id/read
router.patch("/:id/read", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notification = await notificationService.markAsRead(req.params.id);
    res.json({ success: true, data: notification });
  } catch (err) { next(err); }
});

// POST /api/notifications/read-all
router.post("/read-all", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { recipient } = req.body;
    if (!recipient) throw new ValidationError("recipient is required");
    await notificationService.markAllAsRead(recipient);
    res.json({ success: true, data: { marked: true } });
  } catch (err) { next(err); }
});

// GET /api/notifications/preferences
router.get("/preferences", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const recipient = req.query.recipient as string;
    if (!recipient) throw new ValidationError("recipient query parameter is required");
    const prefs = await notificationService.getPreferences(recipient);
    res.json({ success: true, data: prefs });
  } catch (err) { next(err); }
});

// PUT /api/notifications/preferences
router.put("/preferences", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { recipient, event_type, channel, enabled, config } = req.body;
    if (!recipient || !channel) throw new ValidationError("recipient and channel are required");
    const pref = await notificationService.upsertPreference(
      recipient, event_type || "*", channel, enabled !== false, config
    );
    res.json({ success: true, data: pref });
  } catch (err) { next(err); }
});

// POST /api/notifications/ingest — Cross-app endpoint
router.post("/ingest", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { recipient, event_type, title, body, entity_type, entity_id, channels, metadata } = req.body;
    if (!recipient || !event_type || !title) {
      throw new ValidationError("recipient, event_type, and title are required");
    }
    const notifications = await notificationService.notify({
      recipient, event_type, title, body: body || "", entity_type, entity_id, channels, metadata,
    });
    res.json({ success: true, data: notifications });
  } catch (err) { next(err); }
});

export default router;
