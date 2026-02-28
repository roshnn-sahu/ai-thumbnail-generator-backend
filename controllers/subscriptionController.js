import { stripe } from "../config/stripe.js";
import userModel from "../models/userModel.js";
import subscriptionModel from "../models/subscriptionModel.js";

import { createSubscriptionCheckout } from "../services/subscription.services.js";

export const subscriptionCheckout = async (req, res, next) => {
    try {
        const { planId, isYearly, currency } = req.body;

        // Basic validation (you can move this to validator later)
        if (!planId || typeof isYearly !== "boolean" || !currency) {
            return res.status(400).json({
                success: false,
                message: "Missing or invalid parameters",
            });
        }

        const session = await createSubscriptionCheckout({
            planId,
            isYearly,
            currency,
            user: req.user,
            email: req.auth?.email,
            frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
        });

        return res.status(200).json({
            success: true,
            url: session.url,
        });

    } catch (error) {
        next(error); // Let global error handler manage it
    }
};



export const subscriptionWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error(`Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        console.log("session:", session)
        // Safety checks for metadata
        const metadata = session.metadata || {};
        const userId = metadata.userId || session.client_reference_id;
        const internalPlanId = metadata.internalPlanId || metadata.planId || "unknown";
        const clerkId = metadata.clerkId;

        console.log(`💳 Payment successful. Session: ${session.id}`);
        console.log(`👤 User: ${userId}, Plan: ${internalPlanId}, ClerkId: ${clerkId}`);

        if (!userId) {
            console.warn("⚠️ Webhook skipped: No userId or client_reference_id found in session.");
            return res.json({ received: true });
        }

        try {
            let subscriptionData = null;
            if (session.subscription) {
                // Fetch full subscription details if available
                subscriptionData = await stripe.subscriptions.retrieve(session.subscription);
                console.log("📄 Subscription retrieved:", subscriptionData.id);
            } else {
                console.log("ℹ️ No subscription ID found in session (this is normal for some test triggers).");
            }

            // 1. Create a detailed Subscription record if we have clerkId and subscription details
            if (clerkId && session.subscription && subscriptionData) {
                try {
                    await subscriptionModel.create({
                        userId,
                        clerkId,
                        stripeCustomerId: session.customer,
                        stripeSubscriptionId: session.subscription,
                        plan: internalPlanId,
                        status: subscriptionData.status,
                        currentPeriodStart: new Date(subscriptionData.current_period_start * 1000),
                        currentPeriodEnd: new Date(subscriptionData.current_period_end * 1000),
                        cancelAtPeriodEnd: subscriptionData.cancel_at_period_end,
                    });
                    console.log("✅ Subscription record created.");
                } catch (subErr) {
                    console.error("❌ Error creating subscription record:", subErr.message);
                    // Continue anyway to update user profile
                }
            } else {
                console.warn(`⚠️ Skipping subscription record creation: Missing ${!clerkId ? 'clerkId' : 'subscription data'}`);
            }

            // 2. Update user's main profile
            let creditsToAdd = 0;
            if (internalPlanId === "pro") creditsToAdd = 300;
            else if (internalPlanId === "creator") creditsToAdd = "unlimited";

            const updateData = {
                plan: internalPlanId !== "unknown" ? internalPlanId : undefined,
                stripeCustomerId: session.customer,
                stripeSubscriptionId: session.subscription || undefined,
                subscriptionStatus: subscriptionData ? subscriptionData.status : "active"
            };

            // Remove undefined fields
            Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

            let finalUpdate;
            if (creditsToAdd === "unlimited") {
                finalUpdate = {
                    $set: { ...updateData, credits: "unlimited" }
                };
            } else {
                finalUpdate = {
                    $set: updateData,
                    $inc: { credits: creditsToAdd }
                };
            }

            const updatedUser = await userModel.findByIdAndUpdate(userId, finalUpdate, { new: true });

            if (!updatedUser) {
                console.error(`❌ User not found in database: ${userId}`);
            } else {
                console.log(`✅ User ${userId} updated. New Plan: ${updatedUser.plan}, Credits Added: ${creditsToAdd}`);
            }
        } catch (dbErr) {
            console.error("❌ Database Update Error after Webhook:", dbErr);
        }
    }

    res.json({ received: true });
};