import userModel from "../models/userModel.js";

export const checkCredits = async (req, res, next) => {
  const userId = req.auth?.sub;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = await userModel.findOne({ clerkId: userId });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (user.plan === "creator") {
    return next();
  }

    // Pro users get unlimited image-to-prompt but limited thumbnails
    if (creditType === "imageToPromptCredits" && user.plan === "pro") {
        return next();
    }

    const currentCredits = user[creditType];

    if (currentCredits <= 0) {
        return res.status(403).json({
            message: `No ${creditType === "credits" ? "thumbnail" : "image-to-prompt"} credits left. Upgrade your plan.`,
            creditType
        });
    }

  req.dbUser = user;

  next();
};
