import express from "express"
import { subscriptionCheckout, subscriptionWebhook } from "../controllers/subscriptionController.js"
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.post("/create-checkout-session", express.json(), requireAuth, subscriptionCheckout);
router.post("/webhook", express.raw({ type: 'application/json' }), subscriptionWebhook);


export default router;