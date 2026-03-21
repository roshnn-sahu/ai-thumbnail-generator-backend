export const checkFreeLimit = async (req, res, next) => {
  const user = req.user;

  if (user.plan === "free" && user.thumbnailsUsedToday >= 1) {
    return res.status(403).json({ message: "Daily limit reached" });
  }

  next();
};
