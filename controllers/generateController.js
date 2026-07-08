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
        message:
          "Your daily limit is reached, upgrade to creator plan to get unlimited access",
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
        message:
          "Remix mode is only available for Pro and Creator plans. Upgrade to unlock!",
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
    console.error("Generate thumbnail error", error);
    return res.status(500).json({ error: error.message });
  }
};


export const imageToPrompt = async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: "No image data provided" });
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer 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",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "nvidia/nemotron-nano-12b-v2-vl:free",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "You are an expert prompt engineer specializing in reverse-engineering AI image generation prompts. Your task is to analyze the provided image and output a single, highly detailed text-to-image prompt that could recreate this exact image if fed into an AI image generator (like Midjourney, DALL-E, or Stable Diffusion). Examine the image carefully and extract: 1. SUBJECT: The main subject(s) - species/type, pose, expression, action, distinguishing details. 2. SETTING/ENVIRONMENT: Location, background elements, time of day, weather/atmosphere. 3. COMPOSITION: Camera angle, shot type, framing, depth of field. 4. LIGHTING: Light direction, quality, color temperature, key light source, shadows, highlights. 5. COLOR PALETTE: Dominant colors, color grading style. 6. STYLE/MEDIUM: Photography vs illustration vs 3D render, art style if applicable. 7. TEXTURE & DETAIL: Material qualities, fine details. 8. MOOD/ATMOSPHERE: The emotional tone the image conveys. 9. TECHNICAL QUALITY TAGS: Only include photorealistic, 8k, ultra-detailed etc. if the image genuinely has that quality - do not default to these tags if the image is stylized, painterly, or low-fidelity. RULES: - Describe ONLY what is visibly present in the image. Do not invent details that are not there. - Do not narrate or explain your reasoning - output only the final prompt. - Write the prompt as a single flowing paragraph or comma-separated phrase list, not as a numbered list. - Match technical/style tags to what the image ACTUALLY looks like. - Prefer dense, specific phrasing over generic. Output only the final prompt text, nothing else."
              },
              {
                type: "image_url",
                image_url: {
                  url: image
                }
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter Error:", errorText);
      return res.status(500).json({ error: "Failed to generate prompt from AI" });
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content;

    return res.json({ prompt: result });
  } catch (error) {
    console.error("Image-to-prompt error:", error);
    return res.status(500).json({ error: error.message });
  }
};




