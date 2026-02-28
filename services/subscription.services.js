// services/subscription.service.js
import { stripe } from "../config/stripe.js";
import { PLANS } from "../constants/plan.js";

export const createSubscriptionCheckout = async ({
    planId,
    isYearly,
    currency,
    user,
    email,
    frontendUrl,
}) => {

    const billingCycle = isYearly ? "year" : "month";
    const selectedCurrency = currency.toLowerCase();

    // Get prices from Stripe
    const prices = await stripe.prices.list({
        product: planId,
        active: true,
        currency: selectedCurrency,
        type: "recurring",
    });

    const price = prices.data.find(
        (p) => p.recurring.interval === billingCycle
    );

    if (!price) {
        throw new Error(
            `No active ${selectedCurrency.toUpperCase()} price found for this plan (${billingCycle}).`
        );
    }

    const planConfig = PLANS[planId] || {
        internalId: "unknown",
        name: "Custom Plan",
    };

    const session = await stripe.checkout.sessions.create({
        line_items: [
            {
                price: price.id,
                quantity: 1,
            },
        ],
        mode: "subscription",
        customer_email: email,
        client_reference_id: user._id.toString(),
        metadata: {
            userId: user._id.toString(),
            clerkId: user.clerkId,
            planId: planId,
            internalPlanId: planConfig.internalId,
            billingCycle: isYearly ? "yearly" : "monthly",
        },
        success_url: `${frontendUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${frontendUrl}/pricing`,
    });

    return session;
};