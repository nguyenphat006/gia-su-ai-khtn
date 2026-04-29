import { Request, Response, NextFunction } from "express";
import {
  getAllSystemConfigs,
  getSystemConfig,
  upsertSystemConfig,
} from "../services/system.service.js";

export async function listConfigs(req: Request, res: Response, next: NextFunction) {
  try {
    const configs = await getAllSystemConfigs();
    res.json({
      status: "success",
      data: { configs },
    });
  } catch (error) {
    next(error);
  }
}

export async function getConfig(req: Request, res: Response, next: NextFunction) {
  try {
    const { key } = req.params;
    const value = await getSystemConfig(key);
    
    if (!value) {
      res.status(404).json({ status: "error", message: "Config not found" });
      return;
    }

    res.json({
      status: "success",
      data: { key, value },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateConfig(req: Request, res: Response, next: NextFunction) {
  try {
    const { key } = req.params;
    const { value } = req.body;
    const userId = req.auth?.userId || "system";

    if (!value) {
      res.status(400).json({ status: "error", message: "Value is required" });
      return;
    }

    const updated = await upsertSystemConfig(key, value, userId);

    res.json({
      status: "success",
      data: { config: updated },
    });
  } catch (error) {
    next(error);
  }
}
