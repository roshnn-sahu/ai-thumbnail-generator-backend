import userModel from "../models/userModel.js";

export const syncUser = async (req, res) => {
  try {
    const { sub, sessionClaims } = req.auth;

    let user = await userModel.findOne({ clerkId: sub });

    if (!user) {
      user = await userModel.create({
        clerkId: sub,
        email: sessionClaims.email,
        name: sessionClaims.name,
        image: sessionClaims.image_url,
      });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
export const getUser = async (req, res) => {
  try {
    const { sub, sessionClaims } = req.auth;

    let user = await userModel.findOne({ clerkId: sub });
    if (!user) {
      return res
        .status(403)
        .json({ success: false, message: "user not found" });
    }
    res.status(200).json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
export const updateUser = async (req, res) => {
  try {
    const { sub, sessionClaims } = req.auth;

    console.log(sessionClaims);

    let user = await userModel.findOne({ clerkId: sub });
    if (!user) {
      return res
        .status(403)
        .json({ success: false, message: "user not found" });
    }
    res.status(200).json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
