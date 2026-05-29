import { NextRequest, NextResponse } from "next/server";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequestBody {
  messages: Message[];
}

export async function POST(req: NextRequest) {
  try {
    const body: ChatRequestBody = await req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages array is required." },
        { status: 400 }
      );
    }

    const apiKey = process.env.AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "AI_API_KEY is not configured." },
        { status: 500 }
      );
    }

    const aiResponse = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,  // ✅ HERE
          "HTTP-Referer": "http://localhost:3000", // ✅ HERE
          "X-Title": "AI Chatbot",                // ✅ HERE
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b:free",
          stream: true,
          messages: [
            {
              role: "system",
              content: "You are a helpful, concise, and friendly AI assistant.",
            },
            ...messages,
          ],
        }),
      }
    );

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI API error:", errText);
      return NextResponse.json(
        { error: `Provider error: ${errText}` },
        { status: aiResponse.status }
      );
    }

    const stream = new ReadableStream({
      async start(controller) {
        const reader = aiResponse.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk
            .split("\n")
            .filter((line) => line.startsWith("data: "));

          for (const line of lines) {
            const data = line.replace("data: ", "").trim();

            if (data === "[DONE]") {
              controller.close();
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const token = parsed.choices?.[0]?.delta?.content ?? "";
              if (token) {
                controller.enqueue(new TextEncoder().encode(token));
              }
            } catch {
              // skip malformed lines
            }
          }
        }

        controller.close();
      },
    });

    // ✅ Response headers are ONLY these:
    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });

  } catch (err) {
    console.error("Route handler error:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}