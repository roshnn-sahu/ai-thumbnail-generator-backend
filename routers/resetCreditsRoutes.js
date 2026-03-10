import express from "express"
import { resetDailyCredits } from "../controllers/resetCreditsController.js"

const router = express.Router()

router.get("/reset-daily-credits",resetDailyCredits)

export default router