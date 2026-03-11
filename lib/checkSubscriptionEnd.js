import subscriptionModel from "../models/subscriptionModel.js";
import userModel from "../models/userModel.js";

export const checkUserPlan = async (clerkId) => {
  const user = await userModel.findOne({ clerkId });
  const subscription = await subscriptionModel.findOne({ clerkId });

  if (!subscription) return user;

  const now = new Date();

  if (subscription.subscriptionEnd && now > subscription.subscriptionEnd) {
    await userModel.updateOne(
      { clerkId },
      {
        plan: "free",
        subscriptionStatus: "expired",
        credits: 3
      }
    );

    await subscriptionModel.updateOne(
      { clerkId },
      {
        status: "completed"
      }
    );

    user.plan = "free";
  }

  return user;
};