import { NextRequest, NextResponse } from "next/server";
import { InferenceClient } from "@huggingface/inference";

export async function POST(req: NextRequest) {
  try {
    const { inputText } = await req.json();

    if (!inputText || typeof inputText !== "string") {
      return NextResponse.json({ error: "Missing inputText" }, { status: 400 });
    }

    if (inputText.trim().length === 0) {
      return NextResponse.json(
        { error: "Input text cannot be empty" },
        { status: 400 }
      );
    }

    if (inputText.length > 10000) {
      return NextResponse.json(
        { error: "Input text is too long. Please limit to 10,000 characters." },
        { status: 400 }
      );
    }

    const apiKey = process.env.HUGGINGFACE_API_KEY;
    const model =
      process.env.HUGGINGFACE_MODEL ||
      "meta-llama/Llama-3.1-8B-Instruct";  

    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing HUGGINGFACE_API_KEY" },
        { status: 500 }
      );
    }

    const hf = new InferenceClient(apiKey);

    const prompt = `
    You are an AI that turns raw study material into a structured exam study guide.

    Return ONLY valid JSON with this exact shape:
    {
    "summary": "string",
    "detailed_summary": "string",
    "concepts": [
        { "term": "string", "def": "string" }
    ],
    "questions": ["string"]
    }

    - "summary" = very short high-level overview (2–3 sentences max)
    - "detailed_summary" = deeper explanation (2–6 short paragraphs), still exam-focused
    Do NOT add explanations, markdown, or backticks. Output JSON only.

    Study material:
    """${inputText}"""
    `;


 
    const completion = await hf.chatCompletion({
      model,
      messages: [
        {
          role: "system",
          content:
            "You generate concise, exam-focused study guides. Only output JSON when asked.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 700,
      temperature: 0.4,
    });

    const content = completion?.choices?.[0]?.message?.content;

    if (!content || typeof content !== "string") {
      console.error("Unexpected HF output:", completion);
      return NextResponse.json(
        { error: "Unexpected Hugging Face response", data: completion },
        { status: 500 }
      );
    }

    // Extract JSON safely
    const firstBrace = content.indexOf("{");
    const lastBrace = content.lastIndexOf("}");
    const jsonSlice =
      firstBrace !== -1 && lastBrace !== -1
        ? content.slice(firstBrace, lastBrace + 1)
        : content;

    let parsed;
    try {
      parsed = JSON.parse(jsonSlice);
    } catch (err) {
      console.error("Failed to parse JSON:", err, jsonSlice);
      return NextResponse.json(
        { error: "Failed to parse AI response. Please try again." },
        { status: 500 }
      );
    }

    // Validate parsed structure
    if (
      !parsed ||
      typeof parsed !== "object" ||
      (!parsed.summary && !parsed.concepts && !parsed.questions)
    ) {
      console.error("Invalid response structure:", parsed);
      return NextResponse.json(
        { error: "Invalid response format from AI. Please try again." },
        { status: 500 }
      );
    }

    // Ensure all fields exist with defaults
    const response = {
      summary: parsed.summary || "",
      detailed_summary: parsed.detailed_summary || "",
      concepts: Array.isArray(parsed.concepts) ? parsed.concepts : [],
      questions: Array.isArray(parsed.questions) ? parsed.questions : [],
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Server error in /api/generate:", error);
    return NextResponse.json(
      {
        error: "Server error in /api/generate",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
