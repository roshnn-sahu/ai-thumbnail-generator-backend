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

  if (user.credits <= 0) {
    return res.status(403).json({
      message: "No credits left. Upgrade your plan.",
    });
  }

  req.dbUser = user;

  next();
};
