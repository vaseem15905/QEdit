import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const BLOOM_SYSTEM_PROMPT = `You are an expert in Bloom's Taxonomy for educational assessment.
Your ONLY task is to classify a given question into one of the six Bloom's Taxonomy cognitive levels:

1 - Remember: Recall facts, basic concepts (keywords: define, list, recall, identify, name, state)
2 - Understand: Explain ideas or concepts (keywords: explain, describe, summarize, classify, compare)
3 - Apply: Use knowledge in new situations (keywords: solve, apply, calculate, demonstrate, use)
4 - Analyze: Draw connections among ideas (keywords: analyze, differentiate, examine, distinguish, break down)
5 - Evaluate: Justify a decision or course of action (keywords: evaluate, assess, critique, judge, justify, argue)
6 - Create: Produce new or original work (keywords: design, construct, develop, formulate, create, compose)

Respond with ONLY a single digit from 1 to 6. Do not include any explanation, text, or punctuation. Just the number.`;

export async function POST(request: NextRequest) {
  try {
    const { questionText } = await request.json();

    if (!questionText || typeof questionText !== "string" || !questionText.trim()) {
      return NextResponse.json(
        { error: "Question text is required." },
        { status: 400 }
      );
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: "GROQ_API_KEY is not configured on the server." },
        { status: 500 }
      );
    }

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: BLOOM_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Classify this question into a Bloom's Taxonomy level (respond with ONLY 1, 2, 3, 4, 5, or 6):\n\n"${questionText.trim()}"`,
        },
      ],
      temperature: 0.1,
      max_tokens: 5,
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "";
    const level = parseInt(raw);

    if (isNaN(level) || level < 1 || level > 6) {
      return NextResponse.json(
        { error: `Unexpected response from AI: "${raw}". Please try again.` },
        { status: 500 }
      );
    }

    return NextResponse.json({ bloomLevel: level.toString() });
  } catch (error: unknown) {
    console.error("[Bloom API Error]", error);
    const message =
      error instanceof Error ? error.message : "An unknown error occurred.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
