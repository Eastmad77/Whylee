/**
 * Whylee — AI Daily Question Generator Function
 * File: netlify/functions/questions.js
 * Generates or retrieves daily brain questions as CSV text.
 */

import { OpenAI } from "openai";

export default async (req, res) => {
  try {
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // --- Prompt for generating a small daily CSV ---
    const prompt = `
Generate 3 quick general knowledge brain teaser questions with one correct answer each.
Output strictly as CSV with header "question,answer".
Example:
question,answer
What color is the sky?,Blue
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful question generator for a daily brain app." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7
    });

    const csv = completion.choices[0].message.content.trim();
    res.status(200).send(csv);
  } catch (err) {
    console.error("[Whylee] Function error:", err);

    // --- Fallback CSV to avoid blank responses ---
    const fallback =
      "question,answer\n" +
      "What color is the sky?,Blue\n" +
      "What is 5 + 5?,10\n" +
      "Which planet is known as the Red Planet?,Mars\n";
    res.status(200).send(fallback);
  }
};
