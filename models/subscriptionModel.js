import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  clerkId: {
    type: String,
    required: true,
  },
  razorpayPlanId: String,
  razorpayCustomerId: String,
  razorpaySubscriptionId: String,

  plan: {
    type: String,
  },

  status: String,

  currentPeriodStart: Date,
  currentPeriodEnd: Date,

  cancelAtPeriodEnd: Boolean,

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const subscriptionModel = mongoose.model("Subscription", subscriptionSchema);
export default subscriptionModel;
