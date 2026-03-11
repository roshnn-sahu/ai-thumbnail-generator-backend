import { checkUserPlan } from "../lib/checkSubscriptionEnd.js";

export const checkPlan = async (req, res, next) => {
  const clerkId = req.user.clerkId;

  const user = await checkUserPlan(clerkId);

  next();
};