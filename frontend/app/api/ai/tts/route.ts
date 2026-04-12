import { NextResponse } from "next/server";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

const AGENT_VOICE_MAP: Record<string, string> = {
    agent_smith: "en-US-ChristopherNeural",
    agent_sarah: "en-US-JennyNeural",
    agent_michael: "en-US-GuyNeural",
};

function resolveOfficerVoice(agentType: unknown): string {
    const key = String(agentType || "").trim();
    return AGENT_VOICE_MAP[key] || AGENT_VOICE_MAP.agent_michael;
}

function clampSpeed(value: unknown): number {
    const parsed = Number(value);
    if (Number.isNaN(parsed)) return 0; // msedge-tts uses percentage offset from 0 (e.g. +10%)
    // Map 0.8-1.35 range to percentage offset (-20% to +35%)
    const offset = Math.round((parsed - 1) * 100);
    return Math.min(35, Math.max(-20, offset));
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

        const tts = new MsEdgeTTS();
        await tts.setMetadata(resolveOfficerVoice(agentType), OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
        
        const speedOffset = clampSpeed(speed);
        const pitch = 0;

        // toStream returns an object with audioStream and metadataStream
        const { audioStream } = tts.toStream(normalizedText.slice(0, 2200), {
            rate: speedOffset >= 0 ? `+${speedOffset}%` : `${speedOffset}%`,
            pitch: `+${pitch}Hz`
        });

        // Convert Node.js Readable to Web ReadableStream for Next.js Response
        const webStream = new ReadableStream({
            start(controller) {
                audioStream.on("data", (chunk: any) => controller.enqueue(chunk));
                audioStream.on("end", () => controller.close());
                audioStream.on("error", (err: any) => controller.error(err));
            },
            cancel() {
                audioStream.destroy();
            },
        });

        return new Response(webStream, {
            status: 200,
            headers: {
                "Content-Type": "audio/mpeg",
                "Cache-Control": "public, max-age=3600",
            },
        });
    } catch (error: any) {
        console.error("Free TTS Route Error:", error);
        return NextResponse.json(
            { 
                success: false, 
                message: "Neural voice service temporarily unavailable. Falling back to local synthesis.",
                error: error?.message 
            },
            { status: 500 }
        );
    }
}
