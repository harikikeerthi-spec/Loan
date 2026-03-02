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

    async startInterview(userProfile: Record<string, any>, visaType: string): Promise<string> {
        const systemPrompt = this.buildSystemPrompt(userProfile);
        const prompt = `${systemPrompt}

Visa Type: ${visaType || 'B1/B2 Tourist/Business Visa'}

Start the interview now with the first question on travel purpose. Remember: Ask EXACTLY ONE question. Be formal. Max 25 words.`;

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
        // Build conversation context from history
        let historyContext = '';
        if (conversationHistory && conversationHistory.length > 0) {
            historyContext = '\n\nFull Interview Transcript So Far:\n';
            for (const msg of conversationHistory) {
                const role = msg.role === 'officer' ? 'Officer' : 'Applicant';
                historyContext += `${role}: ${msg.content}\n`;
            }
        }

        const prompt = `You are continuing the mock U.S. visa interview.

Maintain the same rules:
- Ask EXACTLY ONE question at a time.
- Do NOT provide feedback, explanation, or reason.
- Questions must be formal and concise (max 25 words).
- You may ask clarifying or follow-up questions ONLY if the answer is ambiguous.
- Do NOT skip topics unless they are complete.
${historyContext}

Context:
Last Question: ${previousQuestion}
Last Answer: ${transcript}

Continuing Topic: ${currentSection}

If the last answer lacks specifics, ask a clarifying question.
Otherwise move to the next subtopic within the current section.
If the current section is complete, move to the next section in this order:
1. Purpose of travel
2. Funding and financial credibility
3. Ties to home country
4. Employment or academic background
5. Travel history
6. Accommodation and itinerary
7. Return intent

Applicant Profile:
${JSON.stringify(userProfile)}

Visa Type: ${visaType || 'B1/B2 Tourist/Business Visa'}

Generate ONLY the next interview question. No explanations, no preface, just the question.`;

        return this.groqService.chat(prompt);
    }

    async evaluateAnswer(
        visaType: string,
        question: string,
        transcript: string,
    ): Promise<EvaluationResult> {
        const prompt = `You are a U.S. Visa Interview Evaluation Engine.

Analyze the applicant's last response and return ONLY valid JSON in this exact format:

{
  "clarity": number (1-10),
  "confidence": number (1-10),
  "relevance": number (1-10),
  "risk": "Low"|"Medium"|"High",
  "redFlags": [string],
  "missingDetails": [string],
  "suggestedImprovement": [string]
}

Evaluation Criteria:
- Clarity: directness and completeness of answer (1=very unclear, 10=perfectly clear)
- Confidence: certainty implied in wording (1=very uncertain, 10=very confident)
- Relevance: alignment with question intent (1=completely off-topic, 10=perfectly relevant)
- Risk: potential immigration risk level based on the answer
- Red flags: specific risky phrases or logic gaps that could concern an officer
- Missing details: information that should have been included
- Suggested improvement: how the answer could be improved

Visa Type: ${visaType || 'B1/B2'}
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
        let historyText = '';
        for (const msg of conversationHistory) {
            const role = msg.role === 'officer' ? 'Officer' : 'Applicant';
            historyText += `${role}: ${msg.content}\n`;
        }

        const prompt = `You are a U.S. Visa Interview Analysis Expert.

Analyze this complete mock interview and provide a comprehensive final report.

Full Interview Transcript:
${historyText}

Individual Answer Evaluations:
${JSON.stringify(evaluations)}

Visa Type: ${visaType || 'B1/B2'}

Return ONLY valid JSON in this format:
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

    private buildSystemPrompt(userProfile: Record<string, any>): string {
        return `You are a U.S. Visa Consular Officer conducting a realistic, formal mock interview.

Interview Rules:
- Ask EXACTLY ONE question at a time.
- Do NOT provide feedback, explanation, or reason.
- Questions must be formal and concise (max 25 words).
- You may ask clarifying or follow-up questions ONLY if the answer is ambiguous.
- Do NOT skip topics unless they are complete.

Interview Flow Structure:
1. Purpose of travel
2. Funding and financial credibility
3. Ties to home country
4. Employment or academic background
5. Travel history
6. Accommodation and itinerary
7. Return intent

Use the applicant's responses dynamically to shape the next question but always within this structure.

Applicant Profile:
${JSON.stringify(userProfile)}`;
    }
}
