/**
 * Whylee — Scheduled Daily Question Generator
 * File: netlify/functions/generate-questions.js
 *
 * Runs via Netlify Scheduled Function at 02:00 UTC every day
 * → Generates fresh daily questions via OpenAI
 * → Writes them to /public/questions.csv for use by app.js
 */

import fs from "fs";
import path from "path";
import { OpenAI } from "openai";

export default async function handler(req, res) {
  const outputPath = path.resolve("./public/questions.csv");

  try {
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const prompt = `
Generate 6 new daily brain-teaser questions with answers.
Focus on quick, fun, general-knowledge questions suitable for ages 10–70.
Output as CSV with header "question,answer".
Example:
question,answer
What color is the sky?,Blue
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You generate concise, clear daily brain challenge questions for an app." },
        { role: "user", content: prompt }
      ],
      temperature: 0.8
    });

    const csv = completion.choices[0].message.content.trim();

    // Write new CSV to /public
    fs.writeFileSync(outputPath, csv, "utf-8");
    console.log(`[Whylee] ✅ Generated new daily questions at ${new Date().toISOString()}`);

    if (res) res.status(200).send("Daily questions generated successfully.");
    else return { statusCode: 200, body: "Daily questions generated successfully." };

  } catch (err) {
    console.error("[Whylee] ❌ Error generating daily questions:", err);

    const fallback =
      "question,answer\n" +
      "What color is the sky?,Blue\n" +
      "What is 5 + 5?,10\n" +
      "Which planet is known as the Red Planet?,Mars\n" +
      "What is the capital of France?,Paris\n" +
      "What do bees make?,Honey\n" +
      "What is 9 × 3?,27\n";

    fs.writeFileSync(outputPath, fallback, "utf-8");
    if (res) res.status(200).send("Fallback questions written.");
    else return { statusCode: 200, body: "Fallback questions written." };
  }
}
