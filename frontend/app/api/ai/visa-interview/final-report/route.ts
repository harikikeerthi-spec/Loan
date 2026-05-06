import { NextResponse } from 'next/server';

const GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.GROQ_AI_KEY || '';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

function avg(values: number[]): number {
    if (!values.length) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
}

function clampScore100(value: any): number {
    const n = Number(value);
    if (Number.isNaN(n)) return 0;
    return Math.max(0, Math.min(100, Math.round(n)));
}

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

STRICT RULES:
- Do NOT inflate scores.
- If relevance/specificity are weak across answers, overall score must be low to moderate.
- If answers are off-topic or contradictory, include them under criticalIssues and ds160Inconsistencies.
- Avoid generic praise.

Return ONLY a JSON object:
{
    "overallScore": 0,
    "overallRisk": "High",
    "approvalLikelihood": "Unlikely",
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

        // Deterministic final score and risk from actual answer evaluations.
        const evals = Array.isArray(evaluations) ? evaluations : [];
        if (evals.length > 0) {
            const avgClarity = avg(evals.map((e: any) => Number(e.clarity || 0)));
            const avgConfidence = avg(evals.map((e: any) => Number(e.confidence || 0)));
            const avgRelevance = avg(evals.map((e: any) => Number(e.relevance || 0)));
            const avgSpecificity = avg(evals.map((e: any) => Number(e.specificity || 0)));
            const avgConsistency = avg(evals.map((e: any) => Number(e.consistency || 0)));
            const avgConciseness = avg(evals.map((e: any) => Number(e.conciseness || 0)));
            const avgPersuasiveness = avg(evals.map((e: any) => Number(e.persuasiveness || 0)));
            const highRiskCount = evals.filter((e: any) => e.risk === 'High').length;
            const mediumRiskCount = evals.filter((e: any) => e.risk === 'Medium').length;

            const computedOverall = Math.round(
                (avgClarity + avgConfidence + avgRelevance + avgSpecificity + avgConsistency + avgConciseness + avgPersuasiveness) / 7 * 10
            );

            report.overallScore = clampScore100(computedOverall);

            if (report.overallScore < 45 || highRiskCount >= Math.ceil(evals.length / 3)) {
                report.overallRisk = 'High';
            } else if (report.overallScore < 70 || mediumRiskCount > 0) {
                report.overallRisk = 'Medium';
            } else {
                report.overallRisk = 'Low';
            }

            if (report.overallScore >= 85 && report.overallRisk === 'Low') {
                report.approvalLikelihood = 'Very Likely';
            } else if (report.overallScore >= 70) {
                report.approvalLikelihood = 'Likely';
            } else if (report.overallScore >= 55) {
                report.approvalLikelihood = 'Uncertain';
            } else if (report.overallScore >= 40) {
                report.approvalLikelihood = 'Unlikely';
            } else {
                report.approvalLikelihood = 'Very Unlikely';
            }
        } else {
            report.overallScore = clampScore100(report.overallScore || 0);
            report.overallRisk = report.overallRisk || 'High';
            report.approvalLikelihood = report.approvalLikelihood || 'Uncertain';
        }

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
