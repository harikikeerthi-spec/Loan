import { NextResponse } from 'next/server';

const GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.GROQ_AI_KEY || '';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

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

        // Ensure all fields exist
        evaluation.clarity = evaluation.clarity || 5;
        evaluation.confidence = evaluation.confidence || 5;
        evaluation.relevance = evaluation.relevance || 5;
        evaluation.specificity = evaluation.specificity || 5;
        evaluation.consistency = evaluation.consistency || 5;
        evaluation.conciseness = evaluation.conciseness || 5;
        evaluation.persuasiveness = evaluation.persuasiveness || 5;
        evaluation.risk = evaluation.risk || 'Medium';
        evaluation.redFlags = evaluation.redFlags || [];
        evaluation.missingDetails = evaluation.missingDetails || [];
        evaluation.suggestedImprovement = Array.isArray(evaluation.suggestedImprovement)
            ? evaluation.suggestedImprovement
            : evaluation.suggestedImprovement ? [evaluation.suggestedImprovement] : [];
        evaluation.overallScore = evaluation.overallScore || Math.round(
            (evaluation.clarity + evaluation.confidence + evaluation.relevance +
                evaluation.specificity + evaluation.consistency + evaluation.conciseness +
                evaluation.persuasiveness) / 7 * 10
        );
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
