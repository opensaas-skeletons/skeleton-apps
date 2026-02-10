import { Router, Request, Response, NextFunction } from "express";
import * as settingsService from "../services/settings.service";
import { OllamaProvider } from "../services/llm/ollama";
import { AnthropicProvider } from "../services/llm/anthropic";
import { OpenAIProvider } from "../services/llm/openai";

const router = Router();

router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = await settingsService.getSettings();
    res.json({ success: true, data: settings });
  } catch (err) { next(err); }
});

router.put("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = await settingsService.updateSettings(req.body);
    res.json({ success: true, data: settings });
  } catch (err) { next(err); }
});

router.get("/providers", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const providers = [
      new OllamaProvider(),
      new AnthropicProvider(),
      new OpenAIProvider(),
    ];

    const infos = await Promise.all(providers.map((p) => p.getInfo()));
    res.json({ success: true, data: infos });
  } catch (err) { next(err); }
});

export default router;
