// ===== Whylee - Daily AI Question Generator =====
import fetch from "node-fetch";
import fs from "fs";
import path from "path";

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const OUT_PATH = path.join(process.cwd(), "public", "questions.csv");

export const handler = async () => {
  try {
    const prompt = `
Generate 12 quiz questions in CSV format with headers:
Level,Category,Question,OptionA,OptionB,OptionC,OptionD,Answer

- 4 questions per level (1,2,3)
- Level 1: quick logic or math
- Level 2: pattern / reasoning
- Level 3: memory or deduction
- Keep answers clear single words/numbers/letters
    `;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
      }),
    });

    const data = await res.json();
    const csvText = data.choices?.[0]?.message?.content?.trim() || "";
    if (!csvText.startsWith("Level")) throw new Error("No valid CSV output");

    fs.writeFileSync(OUT_PATH, csvText);
    console.log("✅ Questions refreshed:", OUT_PATH);

    return { statusCode: 200, body: "Questions generated OK" };
  } catch (e) {
    console.error(e);
    return { statusCode: 500, body: e.toString() };
  }
};
