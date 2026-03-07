import { stripe } from "../config/stripe.js";
import userModel from "../models/userModel.js";
import subscriptionModel from "../models/subscriptionModel.js";

import { createRazorpaySubscription } from "../services/subscription.services.js";

export const createSubscription = async (req, res) => {
    try {

        const { planId } = req.body;
        const user = req.user;

        const subscription = await createRazorpaySubscription({
            planId,
            user,
        });

        return res.status(200).json({
            success: true,
            subscription,
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: error.message,
        });

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

        // Safety checks for metadata
        const metadata = session.metadata || {};
        const userId = metadata.userId || session.client_reference_id; // MongoDB _id (fallback)
        const clerkId = metadata.clerkId;                               // Clerk ID (primary)
        const internalPlanId = metadata.internalPlanId || metadata.planId || "unknown";

        console.log(`💳 Payment successful. Session: ${session.id}`);
        console.log(`👤 ClerkId: ${clerkId}, UserId: ${userId}, Plan: ${internalPlanId}`);

        if (!clerkId && !userId) {
            console.warn("⚠️ Webhook skipped: No clerkId or userId found in session metadata.");
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

            // 1. Create a detailed Subscription record — store both IDs for future-proofing
            if (session.subscription && subscriptionData) {
                try {
                    await subscriptionModel.create({
                        userId: userId || undefined,  // MongoDB _id (if available)
                        clerkId,                      // Clerk ID (always present)
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
                console.warn("⚠️ Skipping subscription record creation: Missing subscription data");
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
                    $set: { ...updateData, credits: creditsToAdd }
                };
            }

            // ✅ Primary: find by clerkId (never changes)
            // ✅ Fallback: find by MongoDB _id (in case clerkId is missing for legacy records)
            let updatedUser = null;
            if (clerkId) {
                updatedUser = await userModel.findOneAndUpdate(
                    { clerkId },
                    finalUpdate,
                    { new: true }
                );
            }
            if (!updatedUser && userId) {
                console.warn(`⚠️ clerkId lookup failed, falling back to userId: ${userId}`);
                updatedUser = await userModel.findByIdAndUpdate(userId, finalUpdate, { new: true });
            }

            if (!updatedUser) {
                console.error(`❌ User not found in database. clerkId: ${clerkId}, userId: ${userId}`);
            } else {
                console.log(`✅ User updated. clerkId: ${clerkId}, userId: ${userId}, Plan: ${updatedUser.plan}, Credits: ${updatedUser.credits}`);
            }
        } catch (dbErr) {
            console.error("❌ Database Update Error after Webhook:", dbErr);
        }
    }

    res.json({ received: true });
};