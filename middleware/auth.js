import { verifyToken } from "@clerk/backend";
import userModel from "../models/userModel.js";

export const requireAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;

<<<<<<< Updated upstream
    if (!header) {
      return res.status(401).json({ error: "No auth token" });
=======
        if (!header) {
            return res.status(401).json({ error: "No auth token" });
        }

        const token = header.replace("Bearer ", "");
              // ✅ verify Clerk token
        const payload = await verifyToken(token, {
            secretKey: process.env.CLERK_SECRET_KEY,
        });

        const clerkId = payload.sub; // THIS IS THE USER ID

        // ✅ auto create user in MongoDB
        let user = await userModel.findOne({ clerkId });

        if (!user) {
            user = await userModel.create({
                clerkId,
                plan: "free",
                credits: 3,
                imageToPromptCredits: 1,
                generationCount: 0,
            });
        }


        // attach to request
        req.auth = payload;
        req.user = user;

        next();
    } catch (err) {
        return res.status(401).json({ error: "Invalid token" });
>>>>>>> Stashed changes
    }

    const token = header.replace("Bearer ", "");

    // ✅ verify Clerk token
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });

    const clerkId = payload.sub; // THIS IS THE USER ID

    // ✅ auto create user in MongoDB
    let user = await userModel.findOne({ clerkId });

    if (!user) {
      user = await userModel.create({
        clerkId,
        plan: "free",
        credits: 1,
        generationCount: 0,
      });
    }

    // attach to request
    req.auth = payload;
    req.user = user;

    next();
  } catch (error) {
    console.log(error)
    return res.status(401).json({ error: error, message: "Invalid Token" });
  }
};
