import { NextResponse } from 'next/server';

const GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.GROQ_AI_KEY || '';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

export async function POST(req: Request) {
    try {
        const { visaType, conversationHistory, evaluations } = await req.json();

        if (!GROQ_API_KEY) {
            return NextResponse.json(
                { success: false, message: 'AI service not configured' },
                { status: 500 }
            );
        }

        // Build transcript summary
        const transcript = (conversationHistory || [])
            .map((m: any) => `${m.role === 'officer' ? 'OFFICER' : 'APPLICANT'}: ${m.content}`)
            .join('\n');

        // Compute average scores from evaluations
        const evalSummary = (evaluations || []).length > 0
            ? `Average evaluation scores across ${evaluations.length} answers:
- Clarity: ${(evaluations.reduce((a: number, e: any) => a + (e.clarity || 5), 0) / evaluations.length).toFixed(1)}/10
- Confidence: ${(evaluations.reduce((a: number, e: any) => a + (e.confidence || 5), 0) / evaluations.length).toFixed(1)}/10
- Relevance: ${(evaluations.reduce((a: number, e: any) => a + (e.relevance || 5), 0) / evaluations.length).toFixed(1)}/10
- Specificity: ${(evaluations.reduce((a: number, e: any) => a + (e.specificity || 5), 0) / evaluations.length).toFixed(1)}/10
- Consistency: ${(evaluations.reduce((a: number, e: any) => a + (e.consistency || 5), 0) / evaluations.length).toFixed(1)}/10
- Conciseness: ${(evaluations.reduce((a: number, e: any) => a + (e.conciseness || 5), 0) / evaluations.length).toFixed(1)}/10
- Persuasiveness: ${(evaluations.reduce((a: number, e: any) => a + (e.persuasiveness || 5), 0) / evaluations.length).toFixed(1)}/10
Red flags found: ${evaluations.flatMap((e: any) => e.redFlags || []).join('; ') || 'None'}`
            : 'No per-answer evaluations available.';

        const systemPrompt = `You are a senior visa interview coach generating a comprehensive performance report after a ${visaType} mock visa interview.

FULL INTERVIEW TRANSCRIPT:
${transcript}

EVALUATION DATA:
${evalSummary}

Generate a detailed final report. Be honest and direct — this is to help the applicant improve.

Return ONLY a JSON object:
{
  "overallScore": 72,
  "overallRisk": "Medium",
  "approvalLikelihood": "Likely",
  "strengths": ["Clear about academic goals", "Good knowledge of program"],
  "weaknesses": ["Vague about funding sources", "Hesitant when asked about return plans"],
  "criticalIssues": ["Contradicted DS-160 on funding — said parents pay but application shows loan"],
  "sectionScores": {
    "personalBackground": 8,
    "purposeOfTravel": 7,
    "universityProgram": 8,
    "academicHistory": 6,
    "fundingFinances": 5,
    "tiesHomeCountry": 6,
    "travelHistory": 7,
    "postStudyPlans": 5,
    "overallPresentation": 7
  },
  "ds160Inconsistencies": ["Funding source mismatch", "University name slightly different"],
  "tips": [
    "Practice explaining your funding with exact numbers and bank statements",
    "Have a clear 30-second answer for 'Why this university specifically?'",
    "Prepare concrete examples of ties to home country"
  ],
  "verdict": "The applicant showed decent preparation but needs significant work on financial credibility and return intent. With targeted practice on funding explanations and post-graduation plans, approval chances would improve substantially."
}

SCORING GUIDE:
- overallScore: 0-100
- approvalLikelihood: "Very Likely" | "Likely" | "Uncertain" | "Unlikely" | "Very Unlikely"
- overallRisk: "Low" | "Medium" | "High"
- sectionScores: 1-10 for each category`;

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
                    { role: 'user', content: 'Generate the comprehensive final report now.' },
                ],
                temperature: 0.4,
                max_tokens: 1200,
                response_format: { type: 'json_object' },
            }),
        });

        const data = await res.json();
        const content = data.choices?.[0]?.message?.content || '';
        let report: any;
        try {
            report = JSON.parse(content);
        } catch {
            report = {
                overallScore: 50,
                overallRisk: 'Medium',
                approvalLikelihood: 'Uncertain',
                strengths: ['Completed the interview'],
                weaknesses: ['Could not generate detailed analysis'],
                criticalIssues: [],
                sectionScores: {},
                ds160Inconsistencies: [],
                tips: ['Practice more with the mock interview'],
                verdict: 'Unable to generate comprehensive analysis. Please try again.',
            };
        }

        // Ensure arrays
        report.strengths = report.strengths || [];
        report.weaknesses = report.weaknesses || [];
        report.criticalIssues = report.criticalIssues || [];
        report.ds160Inconsistencies = report.ds160Inconsistencies || [];
        report.tips = report.tips || [];
        report.sectionScores = report.sectionScores || {};
        report.verdict = report.verdict || '';

        return NextResponse.json({
            success: true,
            report,
        });
    } catch (error: any) {
        console.error('Visa interview final-report error:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Failed to generate report' },
            { status: 500 }
        );
    }
}
