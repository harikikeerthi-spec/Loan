import { NextResponse } from "next/server";

const OPENAI_TTS_URL = "https://api.openai.com/v1/audio/speech";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

const AGENT_VOICE_MAP: Record<string, string> = {
    agent_smith: "onyx",
    agent_sarah: "shimmer",
    agent_michael: "echo",
};

function clampSpeed(value: unknown): number {
    const parsed = Number(value);
    if (Number.isNaN(parsed)) return 1;
    return Math.min(1.35, Math.max(0.8, parsed));
}

export async function POST(req: Request) {
    try {
        const { text, agentType, speed } = await req.json();
        const normalizedText = String(text || "").trim();

        if (!normalizedText) {
            return NextResponse.json(
                { success: false, message: "Text is required for speech synthesis." },
                { status: 400 }
            );
        }

        if (!OPENAI_API_KEY) {
            return NextResponse.json(
                { success: false, message: "Neural TTS is not configured on the server." },
                { status: 503 }
            );
        }

        const ttsRes = await fetch(OPENAI_TTS_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts",
                voice: AGENT_VOICE_MAP[String(agentType)] || "alloy",
                input: normalizedText.slice(0, 2200),
                format: "mp3",
                speed: clampSpeed(speed),
            }),
        });

        if (!ttsRes.ok) {
            const raw = await ttsRes.text();
            console.error("Neural TTS upstream error:", raw);
            return NextResponse.json(
                { success: false, message: "Failed to generate neural speech." },
                { status: 502 }
            );
        }

        const audioBuffer = await ttsRes.arrayBuffer();
        return new Response(audioBuffer, {
            status: 200,
            headers: {
                "Content-Type": "audio/mpeg",
                "Cache-Control": "no-store",
            },
        });
    } catch (error: any) {
        console.error("Neural TTS route error:", error);
        return NextResponse.json(
            { success: false, message: error?.message || "Failed to synthesize speech." },
            { status: 500 }
        );
    }
}
