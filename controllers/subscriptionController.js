import crypto from "crypto";
import userModel from "../models/userModel.js";
import subscriptoinModel from "../models/subscriptionModel.js";
import { PLANS } from "../constants/plan.js";
import { razorpay } from "../config/razorpay.js";
import dotenv from "dotenv";
dotenv.config();

import { createRazorpaySubscription } from "../services/subscription.services.js";

export const createSubscription = async (req, res) => {
  try {
    const { planId, clerkUser } = req.body;

    const user = req.user;
    const subscription = await createRazorpaySubscription({
      planId,
      user,
      clerkUser,
    });

    return res.status(200).json({
      success: true,
      subscription,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error,
    });
  }
};

export const subscriptionWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const razorpaySignature = req.headers["x-razorpay-signature"];

    const body = req.body.toString();

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpaySignature) {
      console.error("❌ Invalid Razorpay webhook signature");
      return res.status(400).send("Invalid signature");
    }

    const data = JSON.parse(body);
    const event = data.event;

    console.log("📩 Razorpay Webhook Event:", event);

    // -----------------------------
    // SUBSCRIPTION ACTIVATED
    // -----------------------------
    if (event === "subscription.activated") {
      const subscription = data.payload.subscription.entity;

      const clerkId = subscription.notes?.userId;
      const planId = subscription.notes?.planId;
      const plan = PLANS[planId];

      const user = await userModel.findOne({ clerkId });

      if (!user) {
        console.log("❌ User not found");
        return res.status(404).send("User not found");
      }

      console.log(
        `✅ Subscription activated | User: ${clerkId} | Plan: ${planId}`,
      );

      // Save subscription
      await subscriptionModel.findOneAndUpdate(
        { razorpaySubscriptionId: subscription.id },
        {
          userId: user._id,
          clerkId: clerkId,
          razorpayPlanId: planId,
          razorpayCustomerId: subscription.customer_id,
          razorpaySubscriptionId: subscription.id,
          plan: plan.internalId,
          status: subscription.status,
          subscriptionStart: new Date(subscription.current_start * 1000),
          subscriptionEnd: new Date(subscription.current_end * 1000),
          cancelAtPeriodEnd: false,
        },
        { upsert: true, new: true },
      );

      let creditsToAdd = 0;

      if (plan.internalId === "pro") creditsToAdd = 500;
      else if (plan.internalId === "creator") creditsToAdd = "unlimited";

      // Update user
      await userModel.findOneAndUpdate(
        { clerkId },
        {
          plan: plan.internalId,
          razorpayPlanId: planId,
          razorpayCustomerId: subscription.customer_id,
          razorpaySubscriptionId: subscription.id,
          subscriptionStatus: "active",
          subscriptionStart: new Date(subscription.current_start * 1000),
          subscriptionEnd: new Date(subscription.current_end * 1000),
          credits: creditsToAdd,
        },
      );

      console.log("🎉 User subscription activated");
    }

    // -----------------------------
    // RECURRING PAYMENT SUCCESS
    // -----------------------------
    if (event === "subscription.charged") {
      const subscription = data.payload.subscription.entity;

      await subscriptionModel.findOneAndUpdate(
        { razorpaySubscriptionId: subscription.id },
        {
          status: subscription.status,
          currentPeriodStart: new Date(subscription.current_start * 1000),
          currentPeriodEnd: new Date(subscription.current_end * 1000),
        },
      );

      console.log(
        `💳 Recurring payment success for subscription ${subscription.id}`,
      );
    }

    // -----------------------------
    // SUBSCRIPTION CANCELLED
    // -----------------------------
    if (event === "subscription.cancelled") {
      const subscription = data.payload.subscription.entity;

      const clerkId = subscription.notes?.userId;

      await userModel.findOneAndUpdate(
        { clerkId },
        {
          subscriptionStatus: "cancelled",
          plan: "free",
          credits: 0,
        },
      );

      await subscriptionModel.findOneAndUpdate(
        { razorpaySubscriptionId: subscription.id },
        {
          status: "cancelled",
          cancelAtPeriodEnd: true,
        },
      );

      console.log(`🚫 Subscription cancelled for user ${clerkId}`);
    }

    // -----------------------------
    // PAYMENT FAILED
    // -----------------------------
    if (event === "payment.failed") {
      const payment = data.payload.payment.entity;

      console.log("❌ Payment failed:", payment.id);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error("❌ Razorpay Webhook Error:", error);
    res.status(500).send("Webhook error");
  }
};

export const cancelSubscription = async (req, res) => {
  try {
    const subscriptionId = req.user.razorpaySubscriptionId;

    const response = await razorpay.subscriptions.cancel(subscriptionId);

    res.json({
      success: true,
      message: "Subscription cancelled",
      data: response,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Cancel failed" });
  }
};

export const getBillingHistory = async (req, res) => {
  try {
    const clerkId = req.user.clerkId;

    const payments = await subscriptoinModel
      .find({ clerkId })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      payments,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
};
