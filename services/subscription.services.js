import { razorpay } from "../config/razorpay.js";
import userModel from "../models/userModel.js";

export const createRazorpaySubscription = async ({
  planId,
  user,
  clerkUser,
}) => {
  if (!planId) {
    throw new Error("PlanId is required");
  }

  const email = clerkUser.primaryEmailAddress?.emailAddress;
  const name = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`;

  let razorpayCustomerId = user.razorpayCustomerId;

  // -----------------------------
  // CREATE CUSTOMER IF NOT EXISTS
  // -----------------------------
  if (!razorpayCustomerId) {
    const customer = await razorpay.customers.create({
      name,
      email,
      notes: {
        clerkId: user.clerkId,
      },
    });

    razorpayCustomerId = customer.id;

    await userModel.findOneAndUpdate(
      { clerkId: user.clerkId },
      { razorpayCustomerId },
    );
  }

  // -----------------------------
  // IF USER ALREADY HAS SUBSCRIPTION
  // → UPDATE PLAN (UPGRADE / DOWNGRADE)
  // -----------------------------
if (user.razorpaySubscriptionId) {

  const existingSub = await razorpay.subscriptions.fetch(
    user.razorpaySubscriptionId
  );

  const paymentMethod = existingSub.payment_method;

  // CARD / NETBANKING → UPDATE
  if (paymentMethod !== "upi") {

    console.log("🔄 Updating existing subscription");

    const updatedSubscription = await razorpay.subscriptions.update(
      user.razorpaySubscriptionId,
      {
        plan_id: planId,
        schedule_change_at: "now",
      }
    );

    return updatedSubscription;

  }

  // UPI → CANCEL + CREATE NEW
  console.log("⚠ UPI mandate detected, cancelling old subscription");

  await razorpay.subscriptions.cancel(
    user.razorpaySubscriptionId,
    false
  );
}
  // -----------------------------
  // CREATE NEW SUBSCRIPTION
  // -----------------------------
  console.log("🆕 Creating new subscription");
  const subscription = await razorpay.subscriptions.create({
    plan_id: planId,
    customer_id: razorpayCustomerId,
    total_count: 12,
    customer_notify: 1,
    notes: {
      userId: user.clerkId,
      planId: planId,
    },
  });

  // Save subscription id
  await userModel.findOneAndUpdate(
    { clerkId: user.clerkId },
    {
      razorpaySubscriptionId: subscription.id,
    },
  );

  return subscription;
};
