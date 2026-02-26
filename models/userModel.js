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

    stripeCustomerId: String,
    stripeSubscriptionId: String,

    subscriptionStatus: {
        type: String,
        enum: ["active", "canceled", "past_due", "incomplete"],
        default: null,
    },
    currency: {
        type: String,
        enum: ["usd", "inr"],
    },

    credits: { type: Number, default: 3 },
    lastCreditReset: {
        type: Date,
        default: Date.now,
    },
    generationCount: { type: Number, default: 0 },

    createdAt: { type: Date, default: Date.now },
});

const userModel = mongoose.model("User", userSchema);
export default userModel;
