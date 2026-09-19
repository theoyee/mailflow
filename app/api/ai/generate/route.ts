import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY environment variable is not configured." },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });
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
      model: "gemini-2.5-flash",
      contents: fullPrompt,
    });

    return NextResponse.json({ text: response.text });
  } catch (error: any) {
    console.error("AI Generation Error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate AI content" }, { status: 500 });
  }
}
