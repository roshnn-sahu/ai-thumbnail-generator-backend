import userModel from "../models/userModel.js";

export const resetDailyCredits = async (req, res) => {
  try {
    console.log("Running midnight credit reset for free plan users...");

    const reset = await userModel.updateMany(
      { plan: "free" },
      {
        $set: {
          credits: 3,
          generationCount: 0,
          lastCreditReset: new Date(),
        },
      },
    );
    console.log("Daily credits reset successfully for free plan users.");
    res.status(200).json({
      success: true,
      message: "Daily credits reset successfully for free plan users.",
      data: reset,
    });
  } catch (error) {
    console.error("Midnight reset failed:", error);
    res.status(500).json({ success: false, message: "Midnight reset failed" });
  }
};
