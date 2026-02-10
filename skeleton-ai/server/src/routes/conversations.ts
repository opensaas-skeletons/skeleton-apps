import { Router, Request, Response, NextFunction } from "express";
import * as conversationService from "../services/conversation.service";

const router = Router();

router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const conversations = await conversationService.listConversations();
    res.json({ success: true, data: conversations });
  } catch (err) { next(err); }
});

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const conversation = await conversationService.createConversation(req.body);
    res.status(201).json({ success: true, data: conversation });
  } catch (err) { next(err); }
});

router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const conversation = await conversationService.getConversationWithMessages(req.params.id);
    res.json({ success: true, data: conversation });
  } catch (err) { next(err); }
});

router.put("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const conversation = await conversationService.updateConversation(
      req.params.id,
      req.body.title
    );
    res.json({ success: true, data: conversation });
  } catch (err) { next(err); }
});

router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    await conversationService.deleteConversation(req.params.id);
    res.json({ success: true, data: null });
  } catch (err) { next(err); }
});

export default router;
