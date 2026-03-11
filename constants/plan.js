const isProduction = true;

const OFFLINE = {
  plan_SNuqOid3vopvhN: {
    razorpayPlanId: "plan_SNuqOid3vopvhN",
    internalId: "pro",
    name: "Pro",
    price: 599,
    duration: "monthly",
    days: 30,
    credits: 300,
    unlimited: false,
  },

  plan_SNvsI7uq64Prqj: {
    razorpayPlanId: "plan_SNvsI7uq64Prqj",
    internalId: "pro",
    name: "Pro",
    price: 4999,
    duration: "yearly",
    days: 365,
    credits: 300,
    unlimited: false,
  },

  plan_SNvuCaLmLtEtZh: {
    razorpayPlanId: "plan_SNvuCaLmLtEtZh",
    internalId: "creator",
    name: "Creator",
    price: 999,
    duration: "monthly",
    days: 30,
    credits: null,
    unlimited: true,
  },

  plan_SNvwfidE7ZgAMQ: {
    razorpayPlanId: "plan_SNvwfidE7ZgAMQ",
    internalId: "creator",
    name: "Creator",
    price: 8999,
    duration: "yearly",
    days: 365,
    credits: null,
    unlimited: true,
  },
};
const ONLINE = {
  plan_SPs00Xh2kyEAJ6: {
    razorpayPlanId: "plan_SPs00Xh2kyEAJ6",
    internalId: "pro",
    name: "Pro",
    price: 599,
    duration: "monthly",
    days: 30,
    credits: 300,
    unlimited: false,
  },

  plan_SP4bUyJvcgRsBE: {
    razorpayPlanId: "plan_SP4bUyJvcgRsBE",
    internalId: "pro",
    name: "Pro",
    price: 4999,
    duration: "yearly",
    days: 365,
    credits: 300,
    unlimited: false,
  },

  plan_SP4bVcWrMnarXV: {
    razorpayPlanId: "plan_SP4bVcWrMnarXV",
    internalId: "creator",
    name: "Creator",
    price: 999,
    duration: "monthly",
    days: 30,
    credits: null,
    unlimited: true,
  },

  plan_SP4bWDFkgr0Jrr: {
    razorpayPlanId: "plan_SP4bWDFkgr0Jrr",
    internalId: "creator",
    name: "Creator",
    price: 8999,
    duration: "yearly",
    days: 365,
    credits: null,
    unlimited: true,
  },
};

export const PLANS = isProduction ? ONLINE : OFFLINE;
