import express from "express";
<<<<<<< Updated upstream
import {
  generateThumbnail,
  imageToPrompt,
} from "../controllers/generateController.js";
=======
import { generateThumbnail, imageToPrompt } from "../controllers/generateController.js";
>>>>>>> Stashed changes
import { requireAuth } from "../middleware/auth.js";
import { checkCredits } from "../middleware/checkCredits.js";
import { checkPlan } from "../middleware/checkPlan.js";
const router = express.Router();

<<<<<<< Updated upstream
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
=======
router.post("/generate-thumbnail", requireAuth, checkCredits("credits"), generateThumbnail);

router.post("/image-to-prompt", requireAuth, checkCredits("imageToPromptCredits"), imageToPrompt);
>>>>>>> Stashed changes

export default router;
