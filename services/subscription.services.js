import { razorpay } from "../config/razorpay.js";

export const createRazorpaySubscription = async ({ planId, user }) => {

    if (!planId) {
        throw new Error("PlanId is required");
    }

    const subscription = await razorpay.subscriptions.create({
        plan_id: planId,
        customer_notify: 1,
        total_count: 12,
        notes: {
            userId: user.clerkId,
            planId: planId,
        },
    });

    return subscription;
};