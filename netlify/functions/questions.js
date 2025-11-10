/**
 * Whylee — On-Demand Question API
 * File: netlify/functions/questions.js
 *
 * Returns the latest daily questions as CSV.
 * If none exist yet, generates fallback or calls OpenAI live.
 */

import fs from "fs";
import path from "path";
import { OpenAI } from "openai";

export default async function handler(req, res) {
  const csvPath = path.resolve("./public/questions.csv");

  // Serve existing cached CSV if available
  if (fs.existsSync(csvPath)) {
    const fileData = fs.readFileSync(csvPath, "utf-8");
    res.status(200).send(fileData);
    return;
  }

  // Otherwise, generate a quick fallback
  try {
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a concise quiz question generator." },
        { role: "user", content: "Generate 3 quick general-knowledge questions as CSV with header question,answer" }
      ]
    });

    const csv = completion.choices[0].message.content.trim();
    fs.writeFileSync(csvPath, csv, "utf-8");
    res.status(200).send(csv);
  } catch (err) {
    console.error("[Whylee] Function error:", err);
    const fallback =
      "question,answer\n" +
      "What color is the sky?,Blue\n" +
      "What is 2 + 2?,4\n" +
      "What planet is closest to the Sun?,Mercury\n";
    res.status(200).send(fallback);
  }
}
