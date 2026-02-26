import express from "express";
import { generateThumbnail } from "../controllers/generateController.js";
import { requireAuth } from "../middleware/auth.js";
import { checkCredits } from "../middleware/checkCredits.js"

const router = express.Router();

router.post("/generate-thumbnail", requireAuth, checkCredits, generateThumbnail);

export default router;
