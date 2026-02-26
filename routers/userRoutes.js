import express from "express";
import { requireAuth } from "../middleware/auth.js"
import { syncUser, getUser } from "../controllers/userController.js";

const router = express.Router();

router.get("/sync", requireAuth, syncUser);
router.get("/get-user", requireAuth, getUser);
router.post("/update-user", requireAuth, getUser);

export default router;
