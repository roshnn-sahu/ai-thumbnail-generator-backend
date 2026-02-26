import dotenv from "dotenv";
dotenv.config();
import userModel from "./models/userModel.js";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import userRoutes from "./routers/userRoutes.js";
import generateRoutes from "./routers/generateRoutes.js";
import Stripe from "stripe";
import "./jobs/resetDailyUsage.js";
import { requireAuth } from "./middleware/auth.js";
import { PLANS } from "./config/plan.js";

import { connectDB } from "./db/db.js";
connectDB();

const app = express();

app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

const PORT = process.env.PORT || 5000;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

app.get("/", (req, res) => {
    res.send("Server Is Running!");
});

// ⚡ Stripe Webhook (Must be before express.json() for raw body)
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);

    let event;

    try {
        event = stripeClient.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error(`Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const { userId, internalPlanId } = session.metadata;

        console.log(`💰 Payment successful for user ${userId}, plan: ${internalPlanId}`);

        try {
            // Provision credits and update plan
            let creditsToAdd = 0;
            if (internalPlanId === "pro") creditsToAdd = 150;
            if (internalPlanId === "creator") creditsToAdd = 10000; // Large number for unlimited but tracked

            await userModel.findByIdAndUpdate(userId, {
                plan: internalPlanId,
                $inc: { credits: creditsToAdd },
                stripeCustomerId: session.customer,
                stripeSubscriptionId: session.subscription,
                subscriptionStatus: "active"
            });

            console.log(`✅ User ${userId} updated to ${internalPlanId} with ${creditsToAdd} credits`);
        } catch (dbErr) {
            console.error("Database Update Error after Webhook:", dbErr);
        }
    }

    res.json({ received: true });
});

app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/generate", generateRoutes);

app.post('/api/plan/create-checkout-session', requireAuth, async (req, res) => {
    try {
        const { planId, isYearly, currency } = req.body;
        const user = req.user;
        const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);

        console.log(planId, isYearly, currency, "planId, isYearly, currency");
        
        if (!planId || isYearly === undefined || !currency) {
            return res.status(400).json({ success: false, message: "Missing required parameters" });
        }

        const billingCycle = isYearly ? "year" : "month";
        const selectedCurrency = currency.toLowerCase();

        // 🔍 Dynamically find the Price ID for this Product
        const prices = await stripeClient.prices.list({
            product: planId,
            active: true,
            currency: selectedCurrency,
            type: 'recurring',
        });

        const price = prices.data.find(p => p.recurring.interval === billingCycle);

        if (!price) {
            console.error(`No active ${selectedCurrency} price found for product ${planId} with ${billingCycle} interval.`);
            return res.status(400).json({ 
                success: false, 
                message: `No active ${selectedCurrency.toUpperCase()} price found for this plan (${billingCycle}). Please check your Stripe Dashboard.` 
            });
        }

        const planConfig = PLANS[planId] || { internalId: "unknown", name: "Custom Plan" };

        const session = await stripeClient.checkout.sessions.create({
            line_items: [
                {
                    price: price.id,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            customer_email: req.auth.email,
            client_reference_id: user._id.toString(),
            metadata: {
                userId: user._id.toString(),
                clerkId: user.clerkId,
                planId: planId,
                internalPlanId: planConfig.internalId,
                billingCycle: isYearly ? "yearly" : "monthly",
            },
            success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/pricing`,
        });

        res.json({ success: true, url: session.url });
    } catch (error) {
        console.error("Stripe Checkout Error:", error);
        res.status(500).json({ success: false, message: error.message || "Internal server error" });
    }
});




app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
