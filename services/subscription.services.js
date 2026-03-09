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

  // If customer doesn't exist yet, create one
  if (!razorpayCustomerId) {
    const customer = await razorpay.customers.create({
      name,
      email,
      notes: {
        clerkId: user.clerkId,
      },
    });

    razorpayCustomerId = customer.id;

    // Save customer id in database
    await userModel.findOneAndUpdate(
      { clerkId: user.clerkId },
      { razorpayCustomerId },
    );
  }

  // Create subscription using existing customer
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

  return subscription;
};
