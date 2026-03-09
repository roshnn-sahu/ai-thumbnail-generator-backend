import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  clerkId: {
    type: String,
    required: true,
    unique: true,
  },
  email: String,
  name: String,
  image: String,
  plan: {
    type: String,
    enum: ["free", "pro", "creator"],
    default: "free",
  },
  razorpayPlanId: {
    type: String,
    default: null,
  },
  razorpayCustomerId: { type: String, default: null },
  razorpaySubscriptionId: { type: String, default: null },

  subscriptionStatus: {
    type: String,
    default: null,
  },
  subscriptionStart: { type: Date, default: null },
  subscriptionEnd: { type: Date, default: null },
  currency: {
    type: String,
    enum: ["usd", "inr"],
  },

  credits: {
    type: mongoose.Schema.Types.Mixed,
    default: 3,
  },

  lastCreditReset: {
    type: Date,
    default: Date.now,
  },
  generationCount: { type: Number, default: 0 },

  createdAt: { type: Date, default: Date.now },
});

const userModel = mongoose.model("User", userSchema);
export default userModel;
