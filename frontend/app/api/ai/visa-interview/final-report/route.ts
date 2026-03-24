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
        const { visaType, conversationHistory, evaluations, interviewStopped } = await req.json();

        if (!GROQ_API_KEY) {
            return NextResponse.json(
                { success: false, message: 'AI service not configured' },
                { status: 500 }
            );
        }

        const messages = conversationHistory || [];
        const officerCount = messages.filter((m: any) => m.role === 'officer').length;
        const applicantCount = messages.filter((m: any) => m.role === 'applicant').length;
        const wasStoppedMidway = interviewStopped === true || applicantCount < 8;

        // Build transcript summary
        const transcript = messages
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

        const topicListForReport = Object.entries(TOPIC_LABELS)
            .map(([id, label], i) => `${i + 1}. ${id} — ${label}`)
            .join('\n');

        const interviewStatusNote = wasStoppedMidway
            ? `\n\nIMPORTANT — INTERVIEW WAS STOPPED MIDWAY:
The applicant ended the interview early or only answered ${applicantCount} questions out of the expected 11+ topics.
You MUST:
1. ONLY evaluate the topics that were actually covered based on the transcript
2. For topics NOT covered, clearly state "Not evaluated — interview ended before this topic"
3. Give a lower overall score because incomplete interviews are a red flag
4. In the verdict, mention that the interview was incomplete and that topics were left uncovered
5. List which specific topics (from the 11 mandatory topics) were NOT addressed
6. The overall assessment should reflect the incompleteness as a significant concern`
            : '';

        const systemPrompt = `You are a senior visa interview coach generating a comprehensive performance report after a ${visaType} mock visa interview.
${interviewStatusNote}

FULL INTERVIEW TRANSCRIPT:
${transcript}

EVALUATION DATA:
${evalSummary}

THE 11 MANDATORY INTERVIEW TOPICS (evaluate each one):
${topicListForReport}

Generate a detailed final report. Be honest, direct, and specific — this report helps the applicant improve for the real interview.

STRICT RULES:
- Do NOT inflate scores. Be realistic and honest.
- If relevance/specificity are weak across answers, overall score must be low to moderate.
- If answers are off-topic or contradictory, include them under criticalIssues and ds160Inconsistencies.
- Avoid generic praise. Be specific about what was good and what needs work.
- For each of the 11 topics, provide a score based on how well the applicant handled questions in that area.
- If a topic was not covered (interview stopped early), score it as 0 and note it.
- The verdict should be a realistic paragraph as if a real consular officer is assessing.

Return ONLY a JSON object:
{
    "overallScore": 0,
    "overallRisk": "High",
    "approvalLikelihood": "Unlikely",
    "interviewComplete": ${!wasStoppedMidway},
    "topicsCovered": ["list of topic IDs that were actually discussed"],
    "topicsNotCovered": ["list of topic IDs that were NOT discussed"],
    "strengths": ["Specific strength 1", "Specific strength 2"],
    "weaknesses": ["Specific weakness 1", "Specific weakness 2"],
    "criticalIssues": ["Critical issue if any"],
    "sectionScores": {
        "personalBackground": 8,
        "universitySelection": 7,
        "courseSelection": 8,
        "financialCapability": 5,
        "careerGoals": 6,
        "immigrationIntent": 6,
        "universityKnowledge": 7,
        "academicHistory": 7,
        "academicGap": 5,
        "workExperience": 6,
        "postStudyPlans": 5,
        "overallPresentation": 7
    },
    "ds160Inconsistencies": ["Any inconsistencies found"],
    "tips": [
        "Specific actionable improvement tip 1",
        "Specific actionable improvement tip 2",
        "Specific actionable improvement tip 3"
    ],
    "verdict": "A realistic paragraph assessment as if from a real consular officer evaluating the applicant's readiness."
}

SCORING GUIDE:
- overallScore: 0-100
- approvalLikelihood: "Very Likely" | "Likely" | "Uncertain" | "Unlikely" | "Very Unlikely"
- overallRisk: "Low" | "Medium" | "High"
- sectionScores: 1-10 for each category (0 if not covered)`;

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
                    { role: 'user', content: 'Generate the comprehensive final report now based on the interview transcript and evaluations.' },
                ],
                temperature: 0.4,
                max_tokens: 1500,
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
                interviewComplete: !wasStoppedMidway,
                topicsCovered: [],
                topicsNotCovered: [],
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
        report.interviewComplete = report.interviewComplete ?? !wasStoppedMidway;
        report.topicsCovered = report.topicsCovered || [];
        report.topicsNotCovered = report.topicsNotCovered || [];

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

            let computedOverall = Math.round(
                (avgClarity + avgConfidence + avgRelevance + avgSpecificity + avgConsistency + avgConciseness + avgPersuasiveness) / 7 * 10
            );

            // Penalize incomplete interviews
            if (wasStoppedMidway) {
                const topicCoverageRatio = Math.min(1, applicantCount / 11);
                computedOverall = Math.round(computedOverall * (0.5 + 0.5 * topicCoverageRatio));
            }

            report.overallScore = clampScore100(computedOverall);

            if (report.overallScore < 45 || highRiskCount >= Math.ceil(evals.length / 3)) {
                report.overallRisk = 'High';
            } else if (report.overallScore < 70 || mediumRiskCount > 0) {
                report.overallRisk = 'Medium';
            } else {
                report.overallRisk = 'Low';
            }

            // Incomplete interview always bumps risk up
            if (wasStoppedMidway && report.overallRisk === 'Low') {
                report.overallRisk = 'Medium';
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
