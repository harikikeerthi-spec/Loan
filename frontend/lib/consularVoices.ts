export const CONSULAR_AGENT_KEYS = ["agent_smith", "agent_sarah", "agent_michael"] as const;

type KnownConsularAgent = (typeof CONSULAR_AGENT_KEYS)[number];

interface VoiceProfile {
    hints: RegExp[];
    langPriority: string[];
    preferredGender: "male" | "female";
}

const FEMALE_HINTS = [
    /female/i,
    /woman/i,
    /zira/i,
    /samantha/i,
    /victoria/i,
    /karen/i,
    /jenny/i,
    /aria/i,
    /susan/i,
    /hazel/i,
];

const MALE_HINTS = [
    /male/i,
    /man/i,
    /david/i,
    /daniel/i,
    /mark/i,
    /guy/i,
    /james/i,
    /tom/i,
    /fred/i,
    /george/i,
];

const VOICE_PROFILES: Record<KnownConsularAgent, VoiceProfile> = {
    agent_smith: {
        // Authoritative, grounded tone
        hints: [/david/i, /daniel/i, /mark/i, /guy/i, /male/i, /google uk english male/i],
        langPriority: ["en-gb", "en-us", "en-au", "en"],
        preferredGender: "male",
    },
    agent_sarah: {
        // Warm and approachable tone
        hints: [/zira/i, /samantha/i, /victoria/i, /karen/i, /female/i, /google uk english female/i],
        langPriority: ["en-us", "en-gb", "en-au", "en"],
        preferredGender: "female",
    },
    agent_michael: {
        // Neutral and methodical tone
        hints: [/david/i, /mark/i, /james/i, /tom/i, /google us english/i, /male/i],
        langPriority: ["en-us", "en-in", "en-gb", "en"],
        preferredGender: "male",
    },
};

function scoreVoice(voice: SpeechSynthesisVoice, profile: VoiceProfile): number {
    let score = 0;
    const searchable = `${voice.name} ${voice.voiceURI}`;
    const lang = voice.lang.toLowerCase();
    const oppositeGenderHints =
        profile.preferredGender === "female" ? MALE_HINTS : FEMALE_HINTS;
    const preferredGenderHints =
        profile.preferredGender === "female" ? FEMALE_HINTS : MALE_HINTS;

    profile.hints.forEach((hint, index) => {
        if (hint.test(searchable)) {
            score += 40 - index * 3;
        }
    });

    preferredGenderHints.forEach((hint, index) => {
        if (hint.test(searchable)) {
            score += 24 - index;
        }
    });

    oppositeGenderHints.forEach((hint, index) => {
        if (hint.test(searchable)) {
            score -= 20 - index;
        }
    });

    profile.langPriority.forEach((langPrefix, index) => {
        if (lang.startsWith(langPrefix)) {
            score += 25 - index * 5;
        }
    });

    if (lang.startsWith("en")) {
        score += 8;
    }

    return score;
}

export function buildConsularVoiceMap(
    voices: SpeechSynthesisVoice[],
): Record<string, SpeechSynthesisVoice | null> {
    const result: Record<string, SpeechSynthesisVoice | null> = {};
    const englishVoices = voices.filter((voice) => voice.lang.toLowerCase().startsWith("en"));
    const candidates = englishVoices.length ? englishVoices : voices;
    const usedVoiceKeys = new Set<string>();

    const pickOrder: KnownConsularAgent[] = ["agent_sarah", "agent_smith", "agent_michael"];

    for (const agentKey of pickOrder) {
        const profile = VOICE_PROFILES[agentKey];
        const ranked = [...candidates].sort(
            (a, b) => scoreVoice(b, profile) - scoreVoice(a, profile),
        );

        const uniquePick = ranked.find((voice) => !usedVoiceKeys.has(voice.voiceURI));
        const selected = uniquePick || ranked[0] || null;
        result[agentKey] = selected;

        if (selected) {
            usedVoiceKeys.add(selected.voiceURI);
        }
    }

    return result;
}

export function getConsularVoice(
    agentType: string,
    voices: SpeechSynthesisVoice[],
    voiceMap?: Record<string, SpeechSynthesisVoice | null>,
): SpeechSynthesisVoice | null {
    const map = voiceMap || buildConsularVoiceMap(voices);
    const fallbackVoice =
        map.agent_michael ||
        voices.find((voice) => voice.lang.toLowerCase().startsWith("en")) ||
        voices[0] ||
        null;

    return map[agentType] || fallbackVoice;
}
