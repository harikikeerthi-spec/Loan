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
    risk: 'Low' | 'Medium' | 'High';
    redFlags: string[];
    missingDetails: string[];
    suggestedImprovement: string[];
}

export interface InterviewSection {
    id: string;
    label: string;
    completed: boolean;
}

const INTERVIEW_SECTIONS: InterviewSection[] = [
    { id: 'purpose', label: 'Purpose of Travel', completed: false },
    { id: 'funding', label: 'Funding & Financial Credibility', completed: false },
    { id: 'ties', label: 'Ties to Home Country', completed: false },
    { id: 'background', label: 'Employment / Academic Background', completed: false },
    { id: 'travel', label: 'Travel History', completed: false },
    { id: 'accommodation', label: 'Accommodation & Itinerary', completed: false },
    { id: 'return', label: 'Return Intent', completed: false },
];

@Injectable()
export class VisaInterviewService {
    constructor(private readonly groqService: GroqService) { }

    getSections(): InterviewSection[] {
        return INTERVIEW_SECTIONS.map(s => ({ ...s }));
    }

    private getSystemPromptTemplate(): string {
        return `MASTER ADAPTIVE AI INTERVIEW ENGINE PROMPT
(Atlys-Style Voice Optimized Version)

You are a high-fidelity AI Consular Officer. Your goal is to conduct a realistic, two-way voice interview that adapts dynamically to the user's specific answers.

PRIMARY DIRECTIVE:
Do NOT stick to a rigid script. Listen to the user's SPECIFIC details (names, dates, reasons) and ask follow-up questions that probe those details before advancing the section.

BEHAVIORAL RULES:
1. ADAPTIVE FOLLOW-UPS: If the applicant mentions a specific university (e.g., MIT), course (e.g., Robotics), or sponsor, your NEXT question must reference that detail.
   - Poor: "What is your funding?"
   - Adaptive: "You mentioned studying Robotics at MIT; that's a specialized field. Why that specific program instead of others?"
2. PROFESSIONAL ACKNOWLEDGMENT (TWO-WAY FLOW): Use brief, professional acknowledgments to transition between user answers and your next question.
   - Examples: "I see.", "Understood.", "Thank you for that clarification.", "Right.", "I understand."
3. ONE QUESTION AT A TIME: Never ask dual or compound questions. Keep them sharp and under 20 words.
4. TONE: Professional, observant, and slightly analytical. If an answer sounds rehearsed, probe for a more personal perspective.
5. CHALLENGE: If the user is vague, say: "Could you be more specific about that?" or "That's a standard answer; what is your personal motivation?"
6. INTERRUPTIBILITY AWARENESS: Keep your responses concise so the conversation feels fast-paced and natural.

VOICE INTERACTION RULES:
- Mimic the cadence of a real consular officer.
- Acknowledge → Pause (200ms) → Ask next question.
- Do not repeat the user's answer back to them.

INTERVIEW STRUCTURE:
Guide the applicant through these sections, but you MUST jump between them if the user provides information ahead of time:
{{sectionList}}

RESPONSE FORMAT:
Strict valid JSON ONLY.
{
  "question": "Acknowledgment + Next sharp question",
  "currentSection": "id",
  "completedSections": ["ids"],
  "isInterviewOver": boolean
}

INTERVIEW PARAMETERS:
Type: {{interviewType}} | Difficulty: {{difficultyLevel}}
USER PROFILE: {{userProfile}}
CURRENT SECTION: {{currentSection}}

ADAPTIVE INTELLIGENCE:
- If difficulty is "Strict", be more skeptical.
- If answers are precise, move faster.
- If inconsistencies are detected, "flag" them by asking a direct follow-up question.
CONSTRAINTS:
- Never produce text outside the JSON block.
- Only continue the structured interview.`;
    }

    private buildPrompt(
        userProfile: Record<string, any>,
        visaType: string,
        currentSection: string,
        historyContext: string = ''
    ): string {
        const sections = INTERVIEW_SECTIONS.map((s, i) => `${s.id}: ${s.label}`).join('\n');
        const evaluations = `- Consistency\n- Ties to Home Country\n- Financial Capability\n- Travel Intent`;

        let prompt = this.getSystemPromptTemplate()
            .replace('{{sectionList}}', sections)
            .replace('{{interviewType}}', `${visaType} Interview`)
            .replace('{{difficultyLevel}}', 'Strict')
            .replace('{{evaluationAreas}}', evaluations)
            .replace('{{userProfile}}', JSON.stringify(userProfile, null, 2))
            .replace('{{currentSection}}', currentSection);

        if (historyContext) {
            prompt += `\n\nCONVERSATION HISTORY:\n${historyContext}\n\nNEXT JSON RESPONSE:`;
        } else {
            prompt += `\n\nFIRST JSON RESPONSE (start with the first question):`;
        }

        return prompt;
    }

    async startInterview(userProfile: Record<string, any>, visaType: string): Promise<any> {
        const prompt = this.buildPrompt(userProfile, visaType, 'purpose');
        return this.groqService.getJson(prompt);
    }

    async continueInterview(
        userProfile: Record<string, any>,
        visaType: string,
        previousQuestion: string,
        transcript: string,
        currentSection: string,
        conversationHistory: InterviewMessage[],
    ): Promise<any> {
        let historyContext = '';
        if (conversationHistory && conversationHistory.length > 0) {
            historyContext = conversationHistory
                .map(msg => `${msg.role === 'officer' ? 'Interviewer' : 'Applicant'}: ${msg.content}`)
                .join('\n');
        }

        const prompt = this.buildPrompt(userProfile, visaType, currentSection, historyContext);
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
  "risk": "Low"|"Medium"|"High",
  "redFlags": [string],
  "missingDetails": [string],
  "suggestedImprovement": [string]
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
    ): Promise<any> {
        let historyText = conversationHistory
            .map(msg => `${msg.role === 'officer' ? 'Officer' : 'Applicant'}: ${msg.content}`)
            .join('\n');

        const prompt = `Analyze this Complete Visa Interview Session and generate a Final Performance Report.
Return ONLY valid JSON.

Transcript:
${historyText}

Evaluations:
${JSON.stringify(evaluations)}

Format:
{
  "overallScore": number (1-100),
  "overallRisk": "Low"|"Medium"|"High",
  "approvalLikelihood": "Very Likely"|"Likely"|"Uncertain"|"Unlikely"|"Very Unlikely",
  "strengths": [string],
  "weaknesses": [string],
  "criticalIssues": [string],
  "sectionScores": {
    "purpose": number (1-10),
    "funding": number (1-10),
    "ties": number (1-10),
    "background": number (1-10),
    "travel": number (1-10),
    "accommodation": number (1-10),
    "return": number (1-10)
  },
  "tips": [string],
  "verdict": string
}`;

        return this.groqService.getJson(prompt);
    }
}

