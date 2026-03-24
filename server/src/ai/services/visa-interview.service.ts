import { Injectable } from '@nestjs/common';
import { GroqService } from './groq.service';

export interface InterviewMessage {
    role: 'officer' | 'applicant';
    content: string;
    timestamp?: string;
}

export interface EvaluationResult {
    clarity: number;
    confidence: number;
    relevance: number;
    specificity: number;
    consistency: number;
    conciseness: number;
    persuasiveness: number;
    risk: 'Low' | 'Medium' | 'High';
    redFlags: string[];
    missingDetails: string[];
    suggestedImprovement: string[];
    overallScore: number;
    quickTip: string;
}

export interface InterviewSection {
    id: string;
    label: string;
    completed: boolean;
}

const INTERVIEW_SECTIONS: InterviewSection[] = [
    { id: 'personal_background', label: 'Personal Background', completed: false },
    { id: 'university_selection', label: 'University Selection', completed: false },
    { id: 'course_selection', label: 'Course Selection', completed: false },
    { id: 'financial_capability', label: 'Financial Capability', completed: false },
    { id: 'career_goals', label: 'Career Goals', completed: false },
    { id: 'immigration_intent', label: 'Immigration Intent', completed: false },
    { id: 'university_knowledge', label: 'Knowledge about University & Location', completed: false },
    { id: 'academic_history', label: 'Academic History', completed: false },
    { id: 'academic_gap', label: 'Academic Gap Justification', completed: false },
    { id: 'work_experience', label: 'Work Experience', completed: false },
    { id: 'post_study_plans', label: 'Post-Study & Work Plans', completed: false },
];

@Injectable()
export class VisaInterviewService {
    constructor(private readonly groqService: GroqService) { }

    getSections(): InterviewSection[] {
        return INTERVIEW_SECTIONS.map(s => ({ ...s }));
    }

    private getSystemPromptTemplate(): string {
        return `MASTER ADAPTIVE AI INTERVIEW ENGINE PROMPT
(Structured Topic-Wise Voice Optimized Version)

You are a high-fidelity AI Consular Officer. Your goal is to conduct a realistic, structured, two-way voice interview that covers all 11 mandatory topics in order.

PRIMARY DIRECTIVE:
Follow the 11-topic structure strictly. Ask questions topic-by-topic, probing deeper when answers are vague before moving to the next topic. Listen to the user's SPECIFIC details and ask follow-ups that reference those details.

INTERVIEW STRUCTURE — 11 MANDATORY TOPICS (follow in order):
{{sectionList}}

TOPIC-SPECIFIC GUIDANCE:
1. Personal Background: Name, age, hometown, family, current occupation
2. University Selection: Why this specific university? How found it? Applied elsewhere?
3. Course Selection: Why this specific course? How it aligns with background?
4. Financial Capability: Who funds? Exact amounts? Bank statements? Loans?
5. Career Goals: Post-program plans? Specific career path?
6. Immigration Intent: Return plans? Ties to home country?
7. University & Location Knowledge: Campus, city, weather, living costs?
8. Academic History: Previous degrees, grades, GPA, institutions attended
9. Academic Gap Justification: Gaps in education — why? What during the gap?
10. Work Experience: Jobs, relevance to course, why leave to study?
11. Post-Study & Work Plans: After graduation — companies, industries, return timeline?

BEHAVIORAL RULES:
1. ADAPTIVE FOLLOW-UPS: Reference specific details the applicant mentions (names, dates, amounts) in your next question.
2. PROFESSIONAL ACKNOWLEDGMENT: Use brief, natural acknowledgments between answers and questions.
3. ONE QUESTION AT A TIME: Never ask compound questions. Keep them sharp and under 25 words.
4. TONE: Professional, observant, slightly analytical. Probe rehearsed-sounding answers.
5. CHALLENGE: If vague, say: "Could you be more specific?" or "What is your personal motivation?"
6. SKIP if not applicable: Skip Work Experience if none, skip Academic Gap if no gap — but mark them as completed.

VOICE INTERACTION RULES:
- Mimic the cadence of a real consular officer.
- Acknowledge → Brief pause → Ask next question.
- Do not repeat the user's answer back to them.
- Use contractions naturally.
- NEVER use asterisks, stage directions, or action descriptions.

RESPONSE FORMAT:
Strict valid JSON ONLY.
{
  "question": "Acknowledgment + Next sharp question",
  "currentSection": "topic_id",
  "completedSections": ["topic_ids that are done"],
  "isInterviewOver": boolean
}

INTERVIEW PARAMETERS:
Type: {{interviewType}} | Difficulty: {{difficultyLevel}}
USER PROFILE: {{userProfile}}
CURRENT SECTION: {{currentSection}}

ADAPTIVE INTELLIGENCE:
- If difficulty is "Strict", be more skeptical.
- If answers are precise, move faster through topics.
- If inconsistencies are detected, flag them with direct follow-up questions.
- Cross-check verbal answers against the DS-160 profile data.

CONSTRAINTS:
- Never produce text outside the JSON block.
- Only continue the structured interview.
- Cover all 11 topics before ending the interview.`;
    }

    private buildPrompt(
        userProfile: Record<string, any>,
        visaType: string,
        currentSection: string,
        historyContext: string = '',
        agentType: string = 'agent_michael'
    ): string {
        const sections = INTERVIEW_SECTIONS.map((s, i) => `${i + 1}. ${s.id}: ${s.label}`).join('\n');

        const agentLabels: Record<string, string> = {
            'agent_smith': 'Officer Smith (Strict, authoritative, deep voice, 20+ years experience, no patience for vague answers)',
            'agent_sarah': 'Officer Sarah (Warm but sharp, conversational, catches everything behind friendly tone)',
            'agent_michael': 'Officer Michael (Neutral, methodical, clinical, follows procedure exactly)',
        };

        let prompt = this.getSystemPromptTemplate()
            .replace('{{sectionList}}', sections)
            .replace('{{interviewType}}', `${visaType} Interview`)
            .replace('{{difficultyLevel}}', 'Strict')
            .replace('{{userProfile}}', JSON.stringify(userProfile, null, 2))
            .replace('{{currentSection}}', currentSection);

        prompt += `\n\nYou are acting as: ${agentLabels[agentType] || agentLabels['agent_michael']}`;

        if (historyContext) {
            prompt += `\n\nCONVERSATION HISTORY:\n${historyContext}\n\nNEXT JSON RESPONSE:`;
        } else {
            prompt += `\n\nFIRST JSON RESPONSE:
1. You MUST introduce yourself by name and role first. Example: "Good morning. I am Officer [Name]. I'll be conducting your visa interview today."
2. Then immediately ask the first question about the applicant's Personal Background (name, purpose of visit).
3. Combine the introduction and question in the "question" field of the JSON.
4. Smith: Brief, commanding intro. Sarah: Warm, welcoming intro. Michael: Procedural, formal intro.
5. Keep it natural and under 4 sentences total.`;
        }

        return prompt;
    }

    async startInterview(userProfile: Record<string, any>, visaType: string, agentType: string): Promise<any> {
        const prompt = this.buildPrompt(userProfile, visaType, 'personal_background', '', agentType);
        return this.groqService.getJson(prompt);
    }

    async continueInterview(
        userProfile: Record<string, any>,
        visaType: string,
        previousQuestion: string,
        transcript: string,
        currentSection: string,
        conversationHistory: InterviewMessage[],
        agentType: string = 'agent_michael'
    ): Promise<any> {
        let historyContext = '';
        if (conversationHistory && conversationHistory.length > 0) {
            historyContext = conversationHistory
                .map(msg => `${msg.role === 'officer' ? 'Interviewer' : 'Applicant'}: ${msg.content}`)
                .join('\n');
        }

        const prompt = this.buildPrompt(userProfile, visaType, currentSection, historyContext, agentType);
        return this.groqService.getJson(prompt);
    }

    async evaluateAnswer(
        visaType: string,
        question: string,
        transcript: string,
    ): Promise<EvaluationResult> {
        const prompt = `You are a structured JSON-only scoring engine for Visa Interviews.
Analyze the applicant's response to the specific question and return ONLY valid JSON.

FORMAT:
{
  "clarity": number (1-10),
  "confidence": number (1-10),
  "relevance": number (1-10),
  "specificity": number (1-10),
  "consistency": number (1-10),
  "conciseness": number (1-10),
  "persuasiveness": number (1-10),
  "risk": "Low"|"Medium"|"High",
  "redFlags": [string],
  "missingDetails": [string],
  "suggestedImprovement": [string],
  "overallScore": number (0-100),
  "quickTip": string
}

DATA:
Visa Type: ${visaType}
Question: ${question}
Answer: ${transcript}

Return ONLY valid JSON. No markdown, no explanation.`;

        return this.groqService.getJson<EvaluationResult>(prompt);
    }

    async generateFinalReport(
        visaType: string,
        conversationHistory: InterviewMessage[],
        evaluations: EvaluationResult[],
        interviewStopped?: boolean,
    ): Promise<any> {
        let historyText = conversationHistory
            .map(msg => `${msg.role === 'officer' ? 'Officer' : 'Applicant'}: ${msg.content}`)
            .join('\n');

        const topicsList = INTERVIEW_SECTIONS.map((s, i) => `${i + 1}. ${s.id}: ${s.label}`).join('\n');

        const stoppedNote = interviewStopped
            ? `\nIMPORTANT: The interview was STOPPED MIDWAY. Only evaluate topics that were actually covered. Note uncovered topics and penalize the overall score for incompleteness.`
            : '';

        const prompt = `Analyze this Complete Visa Interview Session and generate a Final Performance Report.
Return ONLY valid JSON.
${stoppedNote}

Transcript:
${historyText}

Evaluations:
${JSON.stringify(evaluations)}

The 11 Mandatory Interview Topics:
${topicsList}

Format:
{
  "overallScore": number (1-100),
  "overallRisk": "Low"|"Medium"|"High",
  "approvalLikelihood": "Very Likely"|"Likely"|"Uncertain"|"Unlikely"|"Very Unlikely",
  "interviewComplete": boolean,
  "topicsCovered": ["topic_ids"],
  "topicsNotCovered": ["topic_ids"],
  "strengths": [string],
  "weaknesses": [string],
  "criticalIssues": [string],
  "sectionScores": {
    "personalBackground": number (1-10),
    "universitySelection": number (1-10),
    "courseSelection": number (1-10),
    "financialCapability": number (1-10),
    "careerGoals": number (1-10),
    "immigrationIntent": number (1-10),
    "universityKnowledge": number (1-10),
    "academicHistory": number (1-10),
    "academicGap": number (1-10),
    "workExperience": number (1-10),
    "postStudyPlans": number (1-10),
    "overallPresentation": number (1-10)
  },
  "ds160Inconsistencies": [string],
  "tips": [string],
  "verdict": string
}`;

        return this.groqService.getJson(prompt);
    }
}
