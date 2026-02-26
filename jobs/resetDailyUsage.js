import cron from "node-cron";
import userModel from "../models/userModel.js";

//0 0 * * *  for 12am night This runs every day at 12:00 AM
cron.schedule("0 0 * * *", async () => {
    try {
        console.log("Running midnight credit reset...");

        await userModel.updateMany(
            {},
            {
                $set: {
                    credits: 3,
                    generationCount: 0,
                    lastCreditReset: new Date(),
                },
            }
        );

        console.log("Daily credits reset successfully.");
    } catch (error) {
        console.error("Midnight reset failed:", error);
    }
});