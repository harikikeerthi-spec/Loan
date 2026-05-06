import { NextResponse } from 'next/server';

const GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.GROQ_AI_KEY || '';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const STOP_WORDS = new Set([
    'the', 'a', 'an', 'and', 'or', 'to', 'of', 'in', 'on', 'for', 'with', 'from', 'by',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'do', 'does', 'did', 'this', 'that',
    'these', 'those', 'it', 'its', 'as', 'at', 'about', 'your', 'you', 'i', 'my', 'we',
]);

function tokenize(value: string): string[] {
    return (value || '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

function clamp10(value: any): number {
    const n = Number(value);
    if (Number.isNaN(n)) return 5;
    return Math.max(1, Math.min(10, Math.round(n)));
}

export async function POST(req: Request) {
    try {
        const { visaType, question, transcript } = await req.json();

        if (!GROQ_API_KEY) {
            return NextResponse.json(
                { success: false, message: 'AI service not configured' },
                { status: 500 }
            );
        }

        const systemPrompt = `You are an expert visa interview coach evaluating an applicant's answer to a ${visaType} visa interview question.

OFFICER'S QUESTION: "${question}"
APPLICANT'S ANSWER: "${transcript}"

Evaluate this answer across 7 categories, each scored 1-10:
1. Clarity — Is the answer clear, well-structured, and easy to understand?
2. Confidence — Does the applicant sound confident and assured?
3. Relevance — Does the answer directly address what was asked?
4. Specificity — Does the answer include concrete details (names, dates, numbers)?
5. Consistency — Does the answer seem internally consistent and believable?
6. Conciseness — Is the answer appropriately brief without being too long or too short?
7. Persuasiveness — Would this answer satisfy a skeptical consular officer?

STRICT RELEVANCE RULES (IMPORTANT):
- If the answer does NOT address the asked question, Relevance MUST be 1-3.
- If the answer is generic filler ("I don't know", "okay", random unrelated story), Persuasiveness MUST be <= 4.
- If the answer is very short (< 10 words) and lacks substance, Specificity and Persuasiveness MUST be <= 4.
- Never give high scores for off-topic answers.

Also assess:
- Risk level: "Low", "Medium", or "High" (chance of visa denial based on this answer)
- Red flags: Any statements that could hurt the application
- Missing details: Important information the applicant should have included
- Suggested improvement: A BETTER version of the answer that would score higher (write it as if the applicant is speaking)

Return ONLY a JSON object:
{
  "clarity": 7,
  "confidence": 6,
  "relevance": 8,
  "specificity": 5,
  "consistency": 8,
  "conciseness": 7,
  "persuasiveness": 6,
  "risk": "Medium",
  "redFlags": ["Mentioned wanting to stay permanently"],
  "missingDetails": ["Did not mention specific funding amount"],
  "suggestedImprovement": ["A better answer would be: ..."],
    "overallScore": 67,
  "quickTip": "Be more specific about your funding source and exact amounts."
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
                    { role: 'user', content: 'Evaluate this answer now.' },
                ],
                temperature: 0.3,
                max_tokens: 600,
                response_format: { type: 'json_object' },
            }),
        });

        const data = await res.json();
        const content = data.choices?.[0]?.message?.content || '';
        let evaluation: any;
        try {
            evaluation = JSON.parse(content);
        } catch {
            evaluation = {
                clarity: 5, confidence: 5, relevance: 5, specificity: 5,
                consistency: 5, conciseness: 5, persuasiveness: 5,
                risk: 'Medium', redFlags: [], missingDetails: [],
                suggestedImprovement: [], overallScore: 50,
                quickTip: 'Try to be more specific in your answers.',
            };
        }

        // Ensure all fields exist and are clamped
        evaluation.clarity = clamp10(evaluation.clarity);
        evaluation.confidence = clamp10(evaluation.confidence);
        evaluation.relevance = clamp10(evaluation.relevance);
        evaluation.specificity = clamp10(evaluation.specificity);
        evaluation.consistency = clamp10(evaluation.consistency);
        evaluation.conciseness = clamp10(evaluation.conciseness);
        evaluation.persuasiveness = clamp10(evaluation.persuasiveness);
        evaluation.risk = evaluation.risk || 'Medium';
        evaluation.redFlags = evaluation.redFlags || [];
        evaluation.missingDetails = evaluation.missingDetails || [];
        evaluation.suggestedImprovement = Array.isArray(evaluation.suggestedImprovement)
            ? evaluation.suggestedImprovement
            : evaluation.suggestedImprovement ? [evaluation.suggestedImprovement] : [];
        const questionTokens = new Set(tokenize(question || ''));
        const answerTokens = tokenize(transcript || '');
        const overlapCount = answerTokens.filter((token) => questionTokens.has(token)).length;
        const overlapRatio = questionTokens.size > 0 ? overlapCount / questionTokens.size : 0;
        const answerWordCount = (transcript || '').trim().split(/\s+/).filter(Boolean).length;

        // Deterministic penalties for obviously off-topic or weak responses.
        if (overlapRatio < 0.18) {
            evaluation.relevance = Math.min(evaluation.relevance, 3);
            evaluation.persuasiveness = Math.min(evaluation.persuasiveness, 4);
            evaluation.risk = 'High';
            evaluation.redFlags = [
                ...(evaluation.redFlags || []),
                'Answer appears off-topic for the question asked.',
            ];
        }

        if (answerWordCount < 10) {
            evaluation.specificity = Math.min(evaluation.specificity, 4);
            evaluation.persuasiveness = Math.min(evaluation.persuasiveness, 4);
            evaluation.conciseness = Math.min(evaluation.conciseness, 4);
            evaluation.risk = evaluation.risk === 'Low' ? 'Medium' : evaluation.risk;
            evaluation.missingDetails = [
                ...(evaluation.missingDetails || []),
                'Answer is too short and lacks concrete details.',
            ];
        }

        evaluation.overallScore = Math.round(
            (evaluation.clarity + evaluation.confidence + evaluation.relevance +
                evaluation.specificity + evaluation.consistency + evaluation.conciseness +
                evaluation.persuasiveness) / 7 * 10
        );

        if (evaluation.overallScore < 45) {
            evaluation.risk = 'High';
        } else if (evaluation.overallScore < 70 && evaluation.risk === 'Low') {
            evaluation.risk = 'Medium';
        }

        evaluation.quickTip = evaluation.quickTip || '';

        return NextResponse.json({
            success: true,
            evaluation,
        });
    } catch (error: any) {
        console.error('Visa interview evaluate error:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Failed to evaluate answer' },
            { status: 500 }
        );
    }
}
