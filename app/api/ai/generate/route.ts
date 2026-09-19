import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { prompt, tone, length, context } = await req.json();

    let fullPrompt = `You are a professional email assistant. Generate an email based on the user's instructions.
    
User Instructions: ${prompt}
`;

    if (context) {
      fullPrompt += `\nPrevious Conversation Context:\n${context}\n`;
    }

    if (tone) {
      fullPrompt += `\nTone: ${tone}`;
    }
    if (length) {
      fullPrompt += `\nLength: ${length}`;
    }

    fullPrompt += `\nIMPORTANT RULES:
- Never invent facts, links, or dates.
- Keep the output as just the email body (no subject line unless asked).
- Leave placeholders like {{Name}} or [Your Name] if information is missing.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: fullPrompt,
    });

    return NextResponse.json({ text: response.text });
  } catch (error: any) {
    console.error("AI Generation Error:", error);
    return NextResponse.json({ error: "Failed to generate AI content" }, { status: 500 });
  }
}
