/**
 * Netlify Function: generate-questions.js
 * ---------------------------------------
 * Runs daily via Netlify scheduled job.
 * Generates 12 new questions across all 3 Whylee levels.
 */

import OpenAI from "openai";
import fs from "fs";
import path from "path";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler() {
  try {
    console.log("[Whylee] Generating new daily questions...");

    const prompt = `
      Generate 12 diverse brain-training quiz questions.
      Format as CSV: question,optionA,optionB,optionC,optionD,correctAnswer,level
      Levels: 1 (Quick Fire), 2 (Pattern Solve), 3 (Challenge)
      Keep text short, fun, and solvable in 15 seconds.
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: prompt }],
      temperature: 0.8,
    });

    const csv = completion.choices[0].message.content.trim();
    const filePath = path.join(process.cwd(), "public", "questions.csv");
    fs.writeFileSync(filePath, csv);

    console.log("[Whylee] ✅ New questions saved to public/questions.csv");
    return { statusCode: 200, body: "Questions updated successfully." };
  } catch (error) {
    console.error("[Whylee] ❌ Error generating questions:", error);
    return { statusCode: 500, body: "Error generating questions." };
  }
}
