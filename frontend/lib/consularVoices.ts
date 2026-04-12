export const CONSULAR_AGENT_KEYS = ["agent_smith", "agent_sarah", "agent_michael"] as const;

type KnownConsularAgent = (typeof CONSULAR_AGENT_KEYS)[number];

interface VoiceProfile {
    hints: RegExp[];
    langPriority: string[];
    preferredGender: "male" | "female";
    avoidHints?: RegExp[];
}

function hasAnyHint(value: string, hints: RegExp[]): boolean {
    return hints.some((hint) => hint.test(value));
}

function matchesPreferredGender(voice: SpeechSynthesisVoice, preferredGender: "male" | "female"): boolean {
    const searchable = `${voice.name} ${voice.voiceURI}`;
    const hasFemale = hasAnyHint(searchable, FEMALE_HINTS);
    const hasMale = hasAnyHint(searchable, MALE_HINTS);

    if (preferredGender === "female") {
        return hasFemale && !hasMale;
    }

    return hasMale && !hasFemale;
}

const NATURAL_QUALITY_HINTS = [
    /natural/i,
    /neural/i,
    /online/i,
    /premium/i,
    /enhanced/i,
    /wavenet/i,
    /google us english/i,
    /google uk english/i,
    /microsoft.*online/i,
    /aria/i,
    /jenny/i,
    /guy/i,
    /davis/i,
    /roger/i,
    /ryan/i,
    /libby/i,
    /sonia/i,
    /natasha/i,
];

const ROBOTIC_HINTS = [
    /espeak/i,
    /festival/i,
    /mbrola/i,
    /sam/i,
    /compact/i,
    /sapi 4/i,
    /old/i,
    /default/i,
    /robot/i,
    /basic/i,
    /classic/i,
];

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
    /libby/i,
    /sonia/i,
    /natasha/i,
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
    /roger/i,
    /ryan/i,
    /davis/i,
];

/**
 * Voice profiles for 3 distinct consular officers.
 * Each officer should sound clearly different from the others:
 * - Smith: Deep, authoritative British-accented male voice (commanding presence)
 * - Sarah: Warm, approachable American female voice (conversational and clear)
 * - Michael: Neutral, flat American male voice (procedural and measured)
 */
const VOICE_PROFILES: Record<KnownConsularAgent, VoiceProfile> = {
    agent_smith: {
        // Deep, authoritative, commanding voice — British accent preferred for gravitas
        // Prioritize the deepest male voices available in the browser
        hints: [
            /roger/i,       // Roger is one of the deepest male voices
            /guy/i,         // Guy has a deep, authoritative tone
            /george/i,      // George is deep and British-sounding
            /davis/i,       // Davis is deep American male
            /daniel/i,      // Daniel is a strong male voice
            /microsoft.*roger/i,
            /microsoft.*guy/i,
            /google uk english male/i,
            /google us english.*male/i,
            /male/i,
        ],
        langPriority: ["en-gb", "en-au", "en-us", "en"],
        preferredGender: "male",
        avoidHints: [/zira/i, /samantha/i, /victoria/i, /jenny/i, /aria/i, /libby/i, /sonia/i, /natasha/i, /karen/i, /susan/i, /hazel/i, /female/i],
    },
    agent_sarah: {
        // Warm, conversational, clear female voice — American accent preferred
        hints: [
            /jenny/i,
            /aria/i,
            /libby/i,
            /natasha/i,
            /sonia/i,
            /zira/i,
            /samantha/i,
            /victoria/i,
            /karen/i,
            /female/i,
            /hazel/i,
            /susan/i,
            /google us english female/i,
            /microsoft.*aria/i,
            /microsoft.*jenny/i,
        ],
        langPriority: ["en-us", "en-gb", "en-au", "en"],
        preferredGender: "female",
        avoidHints: [/fred/i, /tom/i, /david/i, /guy/i, /roger/i],
    },
    agent_michael: {
        // Neutral, flat, measured male voice — American accent preferred
        hints: [
            /david/i,
            /mark/i,
            /davis/i,
            /ryan/i,
            /tom/i,
            /james/i,
            /google us english/i,
            /male/i,
            /microsoft.*david/i,
            /microsoft.*mark/i,
            /microsoft.*davis/i,
        ],
        langPriority: ["en-us", "en-in", "en-gb", "en"],
        preferredGender: "male",
        avoidHints: [/zira/i, /samantha/i, /guy/i, /roger/i],
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

    NATURAL_QUALITY_HINTS.forEach((hint, index) => {
        if (hint.test(searchable)) {
            score += 55 - index;
        }
    });

    ROBOTIC_HINTS.forEach((hint, index) => {
        if (hint.test(searchable)) {
            score -= 30 - Math.min(index, 10);
        }
    });

    profile.avoidHints?.forEach((hint, index) => {
        if (hint.test(searchable)) {
            score -= 24 - Math.min(index, 8);
        }
    });

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

    // Browser-provided cloud voices are often more natural than local fallback voices.
    if (voice.localService === false) {
        score += 18;
    }

    if (voice.default) {
        score += 4;
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

    // Pick Sarah first (female), then Smith (British male), then Michael (American male)
    // This order maximizes voice diversity across the three officers.
    const pickOrder: KnownConsularAgent[] = ["agent_sarah", "agent_smith", "agent_michael"];

    for (const agentKey of pickOrder) {
        const profile = VOICE_PROFILES[agentKey];
        const strictGenderCandidates = candidates.filter((voice) =>
            matchesPreferredGender(voice, profile.preferredGender),
        );

        // Prefer strict gender-matched voices first, then gracefully fall back if unavailable.
        const pool = strictGenderCandidates.length ? strictGenderCandidates : candidates;

        const ranked = [...pool].sort(
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
    const targetProfile = VOICE_PROFILES[agentType as KnownConsularAgent];
    const genderMatchedFallback = targetProfile
        ? voices.find((voice) => matchesPreferredGender(voice, targetProfile.preferredGender)) || null
        : null;
    const fallbackVoice =
        genderMatchedFallback ||
        map.agent_michael ||
        voices.find((voice) => voice.lang.toLowerCase().startsWith("en")) ||
        voices[0] ||
        null;

    return map[agentType] || fallbackVoice;
}
