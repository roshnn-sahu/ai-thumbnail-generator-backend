import express from "express"
import { createSubscription, subscriptionWebhook,cancelSubscription } from "../controllers/subscriptionController.js"
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.post("/create-subscription", express.json(), requireAuth, createSubscription);
router.post("/webhook", express.raw({ type: 'application/json' }), subscriptionWebhook);
router.post("/cancel-subscription", requireAuth, cancelSubscription);

export default router;