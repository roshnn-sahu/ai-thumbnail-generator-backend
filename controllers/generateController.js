import axios from "axios";
import userModel from "../models/userModel.js";

export const generateThumbnail = async (req, res) => {
    const REVE_API_KEY = process.env.REVE_API_KEY;
    try {

        const clerkId = req.auth.sub;

        const user = await userModel.findOne({ clerkId });
        if (!user) return res.status(404).json({ error: "User not found" });

        /* =========================
           CREDIT LOGIC
        ========================== */

        const imagesRequested = Math.min(Math.max(req.body.count || 1, 1), 4);

        if (user.plan === "free" && user.credits === 0) {
            return res.status(403).json({
                message: "Your daily limit is reached, upgrade to creator plan to get unlimited access",
            });
        }
        if (user.plan === "free" && user.credits < imagesRequested) {
            return res.status(403).json({
                message: "Not enough credits ",
            });
        }

        /* =========================
           YOUR ORIGINAL LOGIC
        ========================== */

        const { imageBase64, instruction, isRemix, aspectRatio, remixImages } =
            req.body;

        if (isRemix && user.plan === "free") {
            return res.status(403).json({
                message: "Remix mode is only available for Pro and Creator plans. Upgrade to unlock!",
            });
        }

        if (!imageBase64)
            return res.status(400).json({ error: "Image base64 is required" });

        if (!instruction)
            return res.status(400).json({ error: "Instruction is required" });

        const cleanMainImage = imageBase64.replace(/^data:image\/\w+;base64,/, "");

        const cleanRemixImages = (remixImages || []).map((img) =>
            img.replace(/^data:image\/\w+;base64,/, ""),
        );

        const referenceImagesArray = [cleanMainImage, ...cleanRemixImages];

        const headers = {
            Authorization: `Bearer ${REVE_API_KEY}`,
            "Content-Type": "application/json",
            Accept: "application/json",
        };

        const numImages = imagesRequested;

        const imagePromises = Array.from({ length: numImages }).map(async () => {
            if (isRemix) {
                const { data } = await axios.post(
                    "https://api.reve.com/v1/image/remix",
                    {
                        prompt: instruction,
                        reference_images: referenceImagesArray,
                        aspect_ratio: aspectRatio,
                        version: "latest-fast",
                    },
                    { headers },
                );

                return `data:image/png;base64,${data.image}`;
            }

            const { data } = await axios.post(
                "https://api.reve.com/v1/image/edit",
                {
                    edit_instruction: instruction,
                    reference_image: cleanMainImage,
                    aspect_ratio: aspectRatio,
                    version: "latest-fast",
                },
                { headers },
            );

            return `data:image/png;base64,${data.image}`;
        });

        const images = await Promise.all(imagePromises);

        /* =========================
           DEDUCT CREDITS
        ========================== */

        if (user.plan !== "creator") {
            user.credits -= numImages;
            user.generationCount += numImages;
            await user.save();
        }

        return res.json({
            images,
            creditsLeft: user.credits,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error.message });
    }
};
