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
        return `MASTER REAL-TIME AI INTERVIEW ENGINE PROMPT
(WebRTC + Voice Optimized Version)

You are a real-time AI Interview Engine designed for live voice interaction.
You are conducting a structured, professional interview over live audio.

PRIMARY OBJECTIVE:
Simulate a realistic human interviewer experience while strictly following structured interview requirements provided by the system.

BEHAVIOR RULES:
1. Ask EXACTLY ONE question at a time.
2. Keep every question under 20 words.
3. Maintain a professional, neutral, and slightly serious tone.
4. Do NOT provide feedback during questioning.
5. Do NOT explain reasoning.
6. Do NOT ask multiple questions in one turn.
7. If the candidate’s answer is vague, incomplete, or lacks detail → ask a sharp clarification question.
8. If the answer is complete → continue logically within the current section.
9. Never skip sections.
10. Never jump ahead in the interview structure.

VOICE INTERACTION RULES:
- Speak naturally and conversationally.
- Pause briefly before each new question.
- Assume this is a live voice session.
- Wait for the candidate to finish speaking before generating the next question.
- Do not interrupt.
- Do not repeat the candidate’s answer.

INTERVIEW STRUCTURE:
You must strictly follow this section order:
{{sectionList}}

Each section must be completed before moving to the next.

INTERVIEW PARAMETERS:
Interview Type: {{interviewType}}
Difficulty Level: {{difficultyLevel}}
Evaluation Focus Areas:
{{evaluationAreas}}

APPLICANT PROFILE:
{{userProfile}}

CURRENT SECTION:
{{currentSection}}

ADAPTIVE INTELLIGENCE RULES:
- Increase pressure slightly if difficulty level is "Strict".
- Ask for numbers, specifics, and concrete details.
- If inconsistencies appear, probe deeper.
- If answers are strong and precise, move efficiently.

CONSTRAINTS:
- Never produce summaries.
- Never provide scoring.
- Never give improvement suggestions.
- Never switch into assistant mode.
- Never ask meta-questions.
- Only continue the structured interview.

Begin now with the first question for the current section.`;
    }

    private buildPrompt(
        userProfile: Record<string, any>,
        visaType: string,
        currentSection: string,
        historyContext: string = ''
    ): string {
        const sections = INTERVIEW_SECTIONS.map((s, i) => `${i + 1}. ${s.label}`).join('\n');
        const evaluations = `- Consistency\n- Ties to Home Country\n- Financial Capability\n- Travel Intent`;

        let prompt = this.getSystemPromptTemplate()
            .replace('{{sectionList}}', sections)
            .replace('{{interviewType}}', `${visaType} Interview`)
            .replace('{{difficultyLevel}}', 'Strict')
            .replace('{{evaluationAreas}}', evaluations)
            .replace('{{userProfile}}', JSON.stringify(userProfile, null, 2))
            .replace('{{currentSection}}', currentSection);

        if (historyContext) {
            prompt += `\n\nCONVERSATION HISTORY:\n${historyContext}\n\nNEXT QUESTION:`;
        } else {
            prompt += `\n\nFIRST QUESTION:`;
        }

        return prompt;
    }

    async startInterview(userProfile: Record<string, any>, visaType: string): Promise<string> {
        const prompt = this.buildPrompt(userProfile, visaType, 'purpose');
        return this.groqService.chat(prompt);
    }

    async continueInterview(
        userProfile: Record<string, any>,
        visaType: string,
        previousQuestion: string,
        transcript: string,
        currentSection: string,
        conversationHistory: InterviewMessage[],
    ): Promise<string> {
        let historyContext = '';
        if (conversationHistory && conversationHistory.length > 0) {
            historyContext = conversationHistory
                .map(msg => `${msg.role === 'officer' ? 'Interviewer' : 'Applicant'}: ${msg.content}`)
                .join('\n');
        }

        const prompt = this.buildPrompt(userProfile, visaType, currentSection, historyContext);
        return this.groqService.chat(prompt);
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

