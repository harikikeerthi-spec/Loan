import { NextResponse } from 'next/server';

const GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.GROQ_AI_KEY || '';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const INTERVIEW_TOPICS = [
    { id: 'personal_background', label: 'Personal Background' },
    { id: 'purpose_of_travel', label: 'Purpose of Travel' },
    { id: 'university_program', label: 'University & Program Details' },
    { id: 'academic_history', label: 'Academic History' },
    { id: 'funding_finances', label: 'Funding & Financial Credibility' },
    { id: 'sponsor_details', label: 'Sponsor Details' },
    { id: 'ties_home', label: 'Ties to Home Country' },
    { id: 'travel_history', label: 'Travel History' },
    { id: 'post_study_plans', label: 'Post-Study Plans' },
    { id: 'accommodation', label: 'Accommodation & Logistics' },
    { id: 'immigration_intent', label: 'Immigration Intent Assessment' },
];

export async function POST(req: Request) {
    try {
        const { userProfile, visaType, agentType } = await req.json();

        const agentPersona =
            agentType === "agent_smith"
                ? `Officer Smith — a strict, no-nonsense male consular officer in his 50s. He has been doing this for 20 years and has zero patience for vague or rehearsed answers. He speaks in short, clipped sentences. He never makes small talk. He interrupts if something doesn't add up. His tone is authoritative and slightly intimidating. He might say things like "Get to the point.", "That didn't answer my question.", or just "Hmm." before moving on.`
                : agentType === "agent_sarah"
                    ? `Officer Sarah — a warm but sharp female consular officer in her 30s. She's approachable and starts with a friendly tone that puts applicants at ease, but she's extremely observant and will catch inconsistencies. She uses conversational transitions like "That's interesting...", "Tell me more about...", "I see, so...", or "Help me understand...". She occasionally acknowledges good answers with a brief "Okay" or "Got it" before asking the next question. She sounds like a real person having a conversation, not reading from a script.`
                    : `Officer Michael — a measured, professional male consular officer in his 40s. He is neither warm nor cold — completely neutral and methodical. He asks questions in a matter-of-fact tone, pauses briefly after your answer, and moves on. He doesn't react much. He might say "Alright." or "Noted." before his next question. He occasionally pauses mid-sentence as if checking his screen. His style is clinical and efficient.`;

        if (!GROQ_API_KEY) {
            return NextResponse.json(
                { success: false, message: 'AI service not configured' },
                { status: 500 }
            );
        }

        const systemPrompt = `You are ${agentPersona}

You are conducting a ${visaType} visa interview at the US Embassy. The applicant has just walked up to your window.

CRITICAL — VOICE & PERSONALITY RULES:
- You are speaking OUT LOUD to a real person standing in front of you. Write EXACTLY how you would speak — with natural pauses, brief reactions, and real sentence flow.
- NEVER use asterisks, stage directions, or action descriptions like *shuffles papers*. Only output spoken words.
- Keep your opening to 2-3 sentences max. Real officers don't give speeches.
- Use contractions naturally ("What's your name?", "Where're you headed?", "You're applying for...").
- If you are Smith: be curt. "Good morning. Name and purpose of visit." — that's it.
- If you are Sarah: be personable but professional. "Hi there, good morning! Could you start by telling me your full name and what brings you to the embassy today?"
- If you are Michael: be flat and procedural. "Good morning. Please state your full name and the purpose of your visit today."

APPLICANT PROFILE (from DS-160 application):
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
1. Ask ONE question at a time — a single short question
2. Sound like a real human talking, not a chatbot
3. Your first question should ask them to confirm their identity and purpose
4. NEVER break character or mention you are an AI

Return ONLY a JSON object:
{
  "question": "Your spoken opening words to the applicant",
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
                max_tokens: 300,
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
