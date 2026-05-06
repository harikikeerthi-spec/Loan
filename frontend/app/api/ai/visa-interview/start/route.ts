import { NextResponse } from 'next/server';

const GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.GROQ_AI_KEY || '';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const INTERVIEW_TOPICS = [
    { id: 'personal_background', label: 'Personal Background' },
    { id: 'university_selection', label: 'University Selection' },
    { id: 'course_selection', label: 'Course Selection' },
    { id: 'financial_capability', label: 'Financial Capability' },
    { id: 'career_goals', label: 'Career Goals' },
    { id: 'immigration_intent', label: 'Immigration Intent' },
    { id: 'university_knowledge', label: 'Knowledge about University & Location' },
    { id: 'academic_history', label: 'Academic History' },
    { id: 'academic_gap', label: 'Academic Gap Justification' },
    { id: 'work_experience', label: 'Work Experience' },
    { id: 'post_study_plans', label: 'Post-Study & Work Plans' },
];

export async function POST(req: Request) {
    try {
        const { userProfile, visaType, agentType } = await req.json();

        const agentPersona =
            agentType === "agent_smith"
                ? `Officer Smith — a strict, authoritative male consular officer in his 50s with a deep commanding voice. He has been conducting visa interviews for over 20 years and has zero tolerance for vague, rehearsed, or evasive answers. He speaks in short, direct, clipped sentences. He never wastes time on small talk. He will interrupt if something sounds suspicious. His tone is cold, authoritative, and slightly intimidating. He might say things like "Get to the point.", "That doesn't answer my question.", "Try again.", or just "Hmm." before moving on. He stares at you silently for a second before asking the next question. He expects precise, factual answers.`
                : agentType === "agent_sarah"
                    ? `Officer Sarah — a sharp, perceptive female consular officer in her 30s with a warm but professional voice. She appears friendly and approachable, putting applicants at ease with her conversational tone, but she is extremely observant and catches every inconsistency. She uses natural transitions like "That's interesting...", "Tell me more about...", "I see, so...", "Help me understand...", "Okay, and what about...". She briefly acknowledges answers with "Got it" or "Okay" before asking the next question. She sounds genuinely curious, not interrogating — but will probe deeper if something doesn't add up. She occasionally smiles through her words but never lets her guard down.`
                    : `Officer Michael — a measured, procedural male consular officer in his 40s with a neutral, clinical voice. He is neither warm nor cold — completely neutral and methodical. He asks questions in a matter-of-fact tone, pauses briefly after your answer, and moves on. He doesn't react emotionally to any answer. He might say "Alright." or "Noted." or just move directly to the next question. He occasionally pauses as if checking something on his computer screen: "Let me just... okay. So about your funding—". His style is clinical, efficient, and by-the-book. He follows procedure exactly.`;

        if (!GROQ_API_KEY) {
            return NextResponse.json(
                { success: false, message: 'AI service not configured' },
                { status: 500 }
            );
        }

        const topicList = INTERVIEW_TOPICS.map((t, i) => `${i + 1}. ${t.id}: ${t.label}`).join('\n');

        const systemPrompt = `You are ${agentPersona}

You are conducting a ${visaType} visa interview at the US Embassy/Consulate. The applicant has just walked up to your window.

CRITICAL — YOU MUST INTRODUCE YOURSELF FIRST:
Before asking any question, you MUST introduce yourself by name and role. This is mandatory — every real consular officer introduces themselves at the start of an interview.

OFFICER-SPECIFIC INTRODUCTION & OPENING:
- If you are Smith: Brief and authoritative. "Good morning. I am Officer Smith. I'll be conducting your visa interview today. Let's get started. State your full name and purpose of visit."
- If you are Sarah: Warm and welcoming. "Hi there! Good morning. I'm Officer Sarah, and I'll be handling your interview today. Welcome! So, could you start by telling me your full name and why you're here?"
- If you are Michael: Procedural and formal. "Good morning. I am Officer Michael. I will be conducting your ${visaType} interview today. Please begin by stating your full name and the purpose of your visit."

CRITICAL — VOICE & PERSONALITY RULES:
- You are speaking OUT LOUD to a real person standing in front of you at the embassy counter. Write EXACTLY how you would speak — with natural pauses, brief reactions, and real sentence flow.
- NEVER use asterisks, stage directions, action descriptions like *shuffles papers*, or any non-verbal cues. Only output spoken words.
- Your opening should be 2-4 sentences: introduction + first question.
- Use contractions naturally ("What's your name?", "Where're you headed?", "You're applying for...").
- Sound like a real human being, not a chatbot or AI assistant.

INTERVIEW STRUCTURE — 11 MANDATORY TOPICS (ask in this order):
${topicList}

Your FIRST question must start from Topic 1: Personal Background. After introducing yourself, ask the applicant to identify themselves.

APPLICANT PROFILE (from DS-160 application — use this to cross-check verbal answers):
- Full Name: ${userProfile.fullName || 'Not provided'}
- Nationality: ${userProfile.nationality || 'Not provided'}
- Age: ${userProfile.age || 'Not provided'}
- Occupation: ${userProfile.occupation || 'Not provided'}
- University: ${userProfile.university || 'Not provided'}
- Course/Program: ${userProfile.course || 'Not provided'}
- Funding Source: ${userProfile.funding || 'Not provided'}
- Previous Travel: ${userProfile.previousTravel || 'Not provided'}
- Sponsor Name: ${userProfile.sponsorName || 'Not provided'}
- Sponsor Relationship: ${userProfile.sponsorRelation || 'Not provided'}
- Sponsor Income: ${userProfile.sponsorIncome || 'Not provided'}
- Work Experience: ${userProfile.workExperience || 'Not provided'}
- GPA/Percentage: ${userProfile.gpa || 'Not provided'}

RULES:
1. ALWAYS introduce yourself by name first, then ask ONE question
2. Sound like a real consular officer talking, not a chatbot
3. Your first question should ask them to confirm their identity and purpose
4. NEVER break character or mention you are an AI
5. Keep the total opening under 40 words

Return ONLY a JSON object:
{
  "question": "Your self-introduction + first question to the applicant",
  "currentTopic": "personal_background"
}`;

        const res = await fetch(GROQ_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instant',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: 'Begin the visa interview now. The applicant has just stepped up to the window.' },
                ],
                temperature: 0.7,
                max_tokens: 400,
                response_format: { type: 'json_object' },
            }),
        });

        const data = await res.json();
        const content = data.choices?.[0]?.message?.content || '';
        let parsed: { question: string; currentTopic: string };
        try {
            parsed = JSON.parse(content);
        } catch {
            parsed = { question: 'Good morning. Please state your name and tell me why you are applying for this visa.', currentTopic: 'personal_background' };
        }

        return NextResponse.json({
            success: true,
            question: parsed.question,
            currentSection: parsed.currentTopic || 'personal_background',
            sections: INTERVIEW_TOPICS.map(t => ({ id: t.id, label: t.label, completed: false })),
        });
    } catch (error: any) {
        console.error('Visa interview start error:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Failed to start interview' },
            { status: 500 }
        );
    }
}
