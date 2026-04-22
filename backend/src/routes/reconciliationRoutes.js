import express from "express";
import { reconcileUserFavorites } from "../services/reconciliationService.js";

export function createReconciliationRouter({ User, requireAuth }) {
  const router = express.Router();

  function ensureOperator(req, res) {
    const role = String(req.user?.role || "").toLowerCase();
    if (!["admin", "developer"].includes(role)) {
      res.status(403).json({ message: "Developer or admin access required." });
      return false;
    }
    return true;
  }

  router.get("/status", requireAuth, async (req, res) => {
    if (!ensureOperator(req, res)) {
      return;
    }

    const report = await reconcileUserFavorites({ User });
    return res.json(report);
  });

  router.post("/favorites/repair", requireAuth, async (req, res) => {
    if (!ensureOperator(req, res)) {
      return;
    }

    const apply = req.body?.apply === true;
    const report = await reconcileUserFavorites({ User, apply });
    return res.status(apply ? 202 : 200).json(report);
  });

  return router;
}
