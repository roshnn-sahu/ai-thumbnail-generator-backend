import userModel from "../models/userModel.js";

<<<<<<< Updated upstream
export const checkCredits = async (req, res, next) => {
  const userId = req.auth?.sub;
=======
export const checkCredits = (creditType = "credits") => async (
    req,
    res,
    next,
) => {
    const userId = req.auth?.sub;
>>>>>>> Stashed changes

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

<<<<<<< Updated upstream
  if (user.credits <= 0) {
    return res.status(403).json({
      message: "No credits left. Upgrade your plan.",
    });
  }
=======
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
>>>>>>> Stashed changes

  req.dbUser = user;

  next();
};
