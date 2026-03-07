import express from "express"
import { createSubscription, subscriptionWebhook } from "../controllers/subscriptionController.js"
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.post("/create-subscription", express.json(), requireAuth, createSubscription);
router.post("/webhook", express.raw({ type: 'application/json' }), subscriptionWebhook);


export default router;