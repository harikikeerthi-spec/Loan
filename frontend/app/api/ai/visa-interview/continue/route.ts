import { NextResponse } from 'next/server';

const GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.GROQ_AI_KEY || '';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const TOPIC_ORDER = [
    'personal_background',
    'university_selection',
    'course_selection',
    'financial_capability',
    'career_goals',
    'immigration_intent',
    'university_knowledge',
    'academic_history',
    'academic_gap',
    'work_experience',
    'post_study_plans',
];

const TOPIC_LABELS: Record<string, string> = {
    'personal_background': 'Personal Background',
    'university_selection': 'University Selection',
    'course_selection': 'Course Selection',
    'financial_capability': 'Financial Capability',
    'career_goals': 'Career Goals',
    'immigration_intent': 'Immigration Intent',
    'university_knowledge': 'Knowledge about University & Location',
    'academic_history': 'Academic History',
    'academic_gap': 'Academic Gap Justification',
    'work_experience': 'Work Experience',
    'post_study_plans': 'Post-Study & Work Plans',
};

export async function POST(req: Request) {
    try {
        const { userProfile, visaType, previousQuestion, transcript, currentSection, conversationHistory, questionNumber, agentType } = await req.json();

        const agentPersona =
            agentType === "agent_smith"
                ? `Officer Smith — a strict, authoritative male consular officer in his 50s with a deep commanding voice. He has been doing this for 20+ years and has zero patience for vague or rehearsed answers. He speaks in short, clipped, direct sentences. He never makes small talk. He will interrupt or cut you off if something doesn't add up. His tone is cold and slightly intimidating. He might say "Get to the point.", "That didn't answer my question.", "Hmm.", "Try again.", or just move on without acknowledging your answer. He asks follow-ups sharply: "You said X. Explain that." or "Why not Y instead?" He expects factual, precise answers with no rambling.`
                : agentType === "agent_sarah"
                    ? `Officer Sarah — a warm but extremely sharp female consular officer in her 30s with a friendly, conversational voice. She's approachable and starts with a warm tone that puts applicants at ease, but she catches absolutely everything. She uses natural conversational transitions: "That's interesting, so...", "Okay, and...", "I see. Tell me more about...", "Help me understand something...", "Got it. Now...". She briefly acknowledges answers before asking the next question — "Alright, that makes sense." or "Okay." She sounds like she's genuinely curious, not interrogating. But if something doesn't add up, she probes gently: "That's a bit different from what I see here..." She never coaches or praises the applicant.`
                    : `Officer Michael — a measured, procedural male consular officer in his 40s with a neutral, clinical voice. Completely neutral and methodical. He doesn't react emotionally to answers. He may say "Alright." or "Noted." or just move to the next question directly. Occasionally pauses as if reviewing paperwork or checking his computer: "Let me just... okay. So your funding—who's covering the tuition?" He's clinical and efficient. Never hostile, never warm. Follows procedure exactly. His questions are structured and precise.`;

        if (!GROQ_API_KEY) {
            return NextResponse.json(
                { success: false, message: 'AI service not configured' },
                { status: 500 }
            );
        }

        const maxQuestions = 22;
        const currentQ = questionNumber || (conversationHistory?.filter((m: any) => m.role === 'officer').length || 1);
        const isNearEnd = currentQ >= maxQuestions - 2;

        // Determine which topics have been covered and which is next
        const currentTopicIdx = TOPIC_ORDER.indexOf(currentSection);
        const coveredTopics = currentTopicIdx >= 0 ? TOPIC_ORDER.slice(0, currentTopicIdx + 1) : [currentSection];
        const remainingTopics = TOPIC_ORDER.filter(t => !coveredTopics.includes(t));

        const topicListFormatted = TOPIC_ORDER.map((t, i) => {
            const status = coveredTopics.includes(t)
                ? (t === currentSection ? '🔵 CURRENT' : '✅ COVERED')
                : '⬜ PENDING';
            return `${i + 1}. ${t}: ${TOPIC_LABELS[t]} [${status}]`;
        }).join('\n');

        const systemPrompt = `You are ${agentPersona}

You are in the middle of a ${visaType} visa interview. You are talking face-to-face with the applicant through a counter window at the embassy.

CRITICAL — NATURAL CONVERSATION RULES:
- You are SPEAKING OUT LOUD to a real person. Write ONLY the words you would say. No asterisks, no stage directions, no action descriptions.
- Start your response with a brief, natural acknowledgment of what the applicant just said. This is how real conversations work:
  * Smith might say: "Hmm." / "I see." / "Right." / (nothing — just asks the next question directly)
  * Sarah might say: "Okay, got it." / "That makes sense." / "Interesting." / "Alright, so..."
  * Michael might say: "Alright." / "Noted." / "Okay." / (brief pause then next question)
- Then ask your NEXT question naturally.
- Use contractions: "What's", "Where'd", "You're", "Don't", etc.
- If the applicant's answer was unclear or too short, react like a real person: "Sorry, I didn't quite get that — could you say that again?" or "Can you be more specific?"
- If the applicant said something interesting or suspicious, briefly comment before your next question.
- NEVER say "Great answer!" or "Well done!" — real officers don't coach applicants.
- Keep total response to 1-3 sentences max.

APPLICANT DS-160 PROFILE (USE FOR CROSS-CHECKING):
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

STRUCTURED INTERVIEW — 11 MANDATORY TOPICS (follow this order strictly):
${topicListFormatted}

CURRENT TOPIC: ${currentSection} (${TOPIC_LABELS[currentSection] || currentSection})
QUESTION NUMBER: ${currentQ} of ~${maxQuestions}
REMAINING TOPICS: ${remainingTopics.length > 0 ? remainingTopics.map(t => TOPIC_LABELS[t]).join(', ') : 'All topics covered'}

TOPIC-SPECIFIC QUESTION GUIDANCE:
1. Personal Background: Name, age, hometown, family details, current occupation
2. University Selection: Why this specific university? How did you find/choose it? Did you apply to others?
3. Course Selection: Why this specific course/program? How does it align with your background?
4. Financial Capability: Who is funding? Exact amounts? Bank statements? Loan details? Can your family afford this?
5. Career Goals: What do you plan to do after completing the program? Specific career path?
6. Immigration Intent: Will you return to your home country? What ties do you have? Why won't you stay abroad?
7. University & Location Knowledge: What do you know about the university campus, city, weather, cost of living?
8. Academic History: Previous degrees, grades, GPA, which schools/colleges attended
9. Academic Gap Justification: If there are gaps in education — why? What were you doing during the gap?
10. Work Experience: Current/previous jobs, relevance to chosen course, why leave to study?
11. Post-Study & Work Plans: Plans after graduation, specific companies/industries, return timeline

FLOW RULES:
1. Ask ONE question at a time, spoken naturally — under 25 words
2. Stay on the CURRENT topic until you're satisfied with the answer — ask follow-ups if needed
3. Move to the NEXT topic in order when satisfied with the current one
4. If the applicant gives evasive or vague answers, probe deeper on the SAME topic
5. Cross-check verbal answers against the DS-160 profile. If something doesn't match, call it out:
   * Smith: "Hold on. Your application says X but you just said Y. Which is it?"
   * Sarah: "That's a bit different from what I see here... your application mentions X. Can you help me understand?"
   * Michael: "Your DS-160 indicates X. You mentioned Y. Could you clarify?"
6. Skip "Work Experience" if applicant has none and "Academic Gap" if there is no gap — but still include the topic in completedTopics
7. ${isNearEnd ? 'This is near the end. If all topics are covered, wrap up naturally: "Alright, I think that covers everything. Your visa will be processed and you\'ll hear from us." Set endInterview to true.' : 'Continue naturally through the topics.'}
8. NEVER break character or acknowledge being AI

Return ONLY a JSON object:
{
  "question": "Your spoken words (acknowledgment + question)",
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
        const completedTopics = topicIdx >= 0 ? TOPIC_ORDER.slice(0, topicIdx + 1) : [];

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
