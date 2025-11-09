/**
 * Netlify Function: questions.js
 * ---------------------------------------
 * Serves the current daily questions.csv file
 * to the Whylee front-end via /api/questions.
 */

import fs from "fs";
import path from "path";

export default async function handler() {
  try {
    const filePath = path.join(process.cwd(), "public", "questions.csv");
    const data = fs.readFileSync(filePath, "utf8");
    return {
      statusCode: 200,
      headers: { "Content-Type": "text/csv" },
      body: data,
    };
  } catch (err) {
    console.error("[Whylee] Error reading questions.csv:", err);
    return { statusCode: 500, body: "Error loading questions." };
  }
}
