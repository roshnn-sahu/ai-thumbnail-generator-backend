import express from "express";
import { generateThumbnail, imageToPrompt } from "../controllers/generateController.js";
import { requireAuth } from "../middleware/auth.js";
import { checkCredits } from "../middleware/checkCredits.js";
import { checkPlan } from "../middleware/checkPlan.js";
const router = express.Router();

router.post(
  "/generate-thumbnail",
  requireAuth,
  checkCredits,
  checkPlan,
  generateThumbnail,
);
router.post(
  "/image-to-prompt",
  requireAuth,
  checkCredits,
  checkPlan,
  imageToPrompt,
);

export default router;
