import { NextResponse } from 'next/server';

const GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.GROQ_AI_KEY || '';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const TOPIC_ORDER = [
    'personal_background',
    'purpose_of_travel',
    'university_program',
    'academic_history',
    'funding_finances',
    'sponsor_details',
    'ties_home',
    'travel_history',
    'post_study_plans',
    'accommodation',
    'immigration_intent',
];

export async function POST(req: Request) {
    try {
        const { userProfile, visaType, previousQuestion, transcript, currentSection, conversationHistory, questionNumber, agentType } = await req.json();

        const agentPersona =
            agentType === "agent_smith"
                ? `Officer Smith — a strict, no-nonsense male consular officer in his 50s. He has been doing this for 20 years and has zero patience for vague or rehearsed answers. He speaks in short, clipped sentences. He never makes small talk. He might interrupt if something doesn't add up. He might say "Get to the point.", "That didn't answer my question.", "Hmm.", or just move on without acknowledging your answer. He asks follow-ups sharply: "You said X. Explain that." or "Why not Y instead?"`
                : agentType === "agent_sarah"
                    ? `Officer Sarah — a warm but sharp female consular officer in her 30s. She's approachable and conversational, but catches everything. She uses natural transitions: "That's interesting, so...", "Okay, and...", "I see. Tell me more about...", "Help me understand something...", "Got it. Now...". She briefly acknowledges answers before asking the next question — "Alright, that makes sense." or "Okay." She sounds like she's genuinely curious, not interrogating.`
                    : `Officer Michael — a measured, professional male officer in his 40s. Completely neutral. He doesn't react much to answers. He may say "Alright." or "Noted." or just move to the next question. Occasionally pauses as if reviewing paperwork: "Let me just... okay. So your funding—who's covering the tuition?" He's clinical and efficient. Never hostile, never warm.`;

        if (!GROQ_API_KEY) {
            return NextResponse.json(
                { success: false, message: 'AI service not configured' },
                { status: 500 }
            );
        }

        const maxQuestions = 18;
        const currentQ = questionNumber || (conversationHistory?.filter((m: any) => m.role === 'officer').length || 1);
        const isNearEnd = currentQ >= maxQuestions - 2;

        const systemPrompt = `You are ${agentPersona}

You are in the middle of a ${visaType} visa interview. You are talking face-to-face with the applicant through a window.

CRITICAL — NATURAL CONVERSATION RULES:
- You are SPEAKING OUT LOUD. Write ONLY the words you say. No asterisks, no stage directions, no descriptions of actions.
- Start your response with a brief acknowledgment or reaction to what the applicant just said. This is how real conversations work:
  * Smith might say: "Hmm." / "I see." / "Right." / (nothing — just asks the next question)
  * Sarah might say: "Okay, got it." / "That makes sense." / "Interesting." / "Alright, so..."  
  * Michael might say: "Alright." / "Noted." / "Okay." / (brief pause then next question)
- Then ask your next question naturally.
- Use contractions: "What's", "Where'd", "You're", "Don't", etc.
- If the applicant's answer was unclear or too short, react like a real person: "Sorry, I didn't quite get that — could you say that again?" or "Can you be more specific?"
- If the applicant said something interesting, you can briefly comment before your next question.
- NEVER say "Great answer!" or "Well done!" — real officers don't coach applicants.
- Keep total response to 1-3 sentences max.

APPLICANT DS-160 PROFILE:
- Full Name: ${userProfile?.fullName || 'Unknown'}
- Nationality: ${userProfile?.nationality || 'Unknown'}
- Age: ${userProfile?.age || 'Unknown'}
- Occupation: ${userProfile?.occupation || 'Unknown'}
- University: ${userProfile?.university || 'Unknown'}
- Course: ${userProfile?.course || 'Unknown'}
- Funding: ${userProfile?.funding || 'Unknown'}
- Previous Travel: ${userProfile?.previousTravel || 'None'}
- Sponsor: ${userProfile?.sponsorName || 'Not specified'} (${userProfile?.sponsorRelation || 'N/A'}, Income: ${userProfile?.sponsorIncome || 'N/A'})
- Work Experience: ${userProfile?.workExperience || 'None'}
- GPA: ${userProfile?.gpa || 'N/A'}

CURRENT TOPIC: ${currentSection}
QUESTION NUMBER: ${currentQ} of ${maxQuestions}

TOPIC SEQUENCE: ${TOPIC_ORDER.join(' → ')}

DS-160 CONSISTENCY CHECK:
Compare the applicant's verbal answer against their DS-160 data. If something doesn't match, call it out naturally:
  * Smith: "Hold on. Your application says X but you just said Y. Which is it?"
  * Sarah: "That's a bit different from what I see here... your application mentions X. Can you help me understand?"
  * Michael: "Your DS-160 indicates X. You mentioned Y. Could you clarify?"

FLOW RULES:
1. ONE question at a time, spoken naturally
2. Stay on a topic if the answer was vague — probe deeper
3. Move to the next topic when satisfied  
4. Be skeptical but fair — this is a real interview
5. ${isNearEnd ? 'This is near the end. Wrap up naturally. You can give a brief closing like "Alright, I think that covers everything. Your visa will be processed and you\'ll hear from us." or similar.' : 'Continue naturally.'}
6. NEVER break character or acknowledge being AI

Return ONLY a JSON object:
{
  "question": "Your spoken words to the applicant (acknowledgment + question)",
  "currentTopic": "topic_id from the sequence",
  "topicChanged": true/false,
  "inconsistencyDetected": null or "brief description",
  "endInterview": false
}`;

        // Build conversation for Groq
        const groqMessages: { role: string; content: string }[] = [
            { role: 'system', content: systemPrompt },
        ];

        if (conversationHistory && Array.isArray(conversationHistory)) {
            for (const msg of conversationHistory) {
                groqMessages.push({
                    role: msg.role === 'officer' ? 'assistant' : 'user',
                    content: msg.content,
                });
            }
        }

        const res = await fetch(GROQ_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instant',
                messages: groqMessages,
                temperature: 0.7,
                max_tokens: 400,
                response_format: { type: 'json_object' },
            }),
        });

        const data = await res.json();
        const content = data.choices?.[0]?.message?.content || '';
        let parsed: any;
        try {
            parsed = JSON.parse(content);
        } catch {
            parsed = {
                question: 'Can you please elaborate on that?',
                currentTopic: currentSection,
                topicChanged: false,
                inconsistencyDetected: null,
                endInterview: false,
            };
        }

        // Determine new topic
        const newTopic = parsed.currentTopic || currentSection;
        const topicIdx = TOPIC_ORDER.indexOf(newTopic);
        const completedTopics = topicIdx >= 0 ? TOPIC_ORDER.slice(0, topicIdx) : [];

        return NextResponse.json({
            success: true,
            question: parsed.question,
            currentSection: newTopic,
            topicChanged: parsed.topicChanged || false,
            inconsistencyDetected: parsed.inconsistencyDetected || null,
            endInterview: parsed.endInterview || (currentQ >= maxQuestions),
            completedTopics,
        });
    } catch (error: any) {
        console.error('Visa interview continue error:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Failed to continue interview' },
            { status: 500 }
        );
    }
}
