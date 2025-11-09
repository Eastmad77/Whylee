/**
 * Whylee - Daily AI Question Generator
 * ------------------------------------
 * Generates a new questions.csv file with 3 difficulty levels daily.
 * Designed for Netlify Scheduled Functions.
 */

import fetch from "node-fetch";
import fs from "fs";
import path from "path";

const OPENAI_KEY = process.env.OPENAI_API_KEY;

// Path to the file Netlify serves publicly
const OUTPUT_PATH = path.join(process.cwd(), "public", "questions.csv");

export const handler = async () => {
  try {
    const prompt = `
Generate 12 quiz questions in CSV format using these exact headers:
Level,Category,Question,OptionA,OptionB,OptionC,OptionD,Answer

Rules:
- 4 questions per Level (1, 2, 3)
- Level 1 = Quick logic, numbers, word match
- Level 2 = Patterns, sequences, reasoning
- Level 3 = Memory, inference, or deduction
- Keep options short (one word or number)
- Make the Answer column match one of the 4 options
- No explanations, CSV rows only
    `;

    console.log("🧠 Generating Whylee daily questions...");

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // change to "gpt-4o" if you have full access
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
        max_tokens: 800,
      }),
    });

    const data = await res.json();
    const csvText = data.choices?.[0]?.message?.content?.trim() || "";

    if (!csvText.startsWith("Level")) {
      console.error("❌ Invalid AI output");
      throw new Error("No valid CSV header found in model response");
    }

    fs.writeFileSync(OUTPUT_PATH, csvText, "utf8");

    console.log(`✅ New questions saved to ${OUTPUT_PATH}`);
    return { statusCode: 200, body: "Questions generated successfully" };
  } catch (err) {
    console.error("❌ Generation failed:", err);
    return { statusCode: 500, body: err.toString() };
  }
};
