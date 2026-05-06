import { Injectable, Logger } from '@nestjs/common';
import { OpenRouterService } from './open-router.service';

export interface SopAnalysisCategory {
  name: string;
  score: number;
  weight: number;
}

export interface SopFeedback {
  issue: string;
  recommendation: string;
}

export interface SopAnalysisResult {
  totalScore: number;
  quality: 'excellent' | 'good' | 'fair' | 'needs-work';
  categories: SopAnalysisCategory[];
  weakAreas: SopFeedback[];
  summary: string;
}

@Injectable()
export class SopAnalysisService {
  private readonly logger = new Logger(SopAnalysisService.name);

  constructor(private readonly openRouterService: OpenRouterService) {}

  async analyzeSop(text: string): Promise<SopAnalysisResult> {
    const safeText = text || '';
    if (safeText.trim().length < 50) {
      return {
        totalScore: 0,
        quality: 'needs-work',
        categories: [],
        weakAreas: [
          {
            issue: 'Text too short',
            recommendation: 'Provide at least 50 words for accurate analysis',
          },
        ],
        summary:
          'Your SOP is too short. Please provide at least 50 words for comprehensive analysis.',
      };
    }

    try {
      const systemPrompt = `You are an expert admissions counselor and SOP evaluator. 
      Analyze the provided Statement of Purpose (SOP) text rigorously.
      Return the response in strict JSON format matching the following structure:
      {
        "totalScore": number (0-100),
        "quality": "excellent" | "good" | "fair" | "needs-work",
        "categories": [
          { "name": "Clarity", "score": number (0-20), "weight": 0.15 },
          { "name": "Financial Justification", "score": number (0-25), "weight": 0.25 },
          { "name": "Career ROI", "score": number (0-25), "weight": 0.25 },
          { "name": "Originality", "score": number (0-20), "weight": 0.20 },
          { "name": "Post-Study Income Clarity", "score": number (0-10), "weight": 0.15 }
        ],
        "weakAreas": [
          { "issue": "string", "recommendation": "string" }
        ],
        "summary": "string"
      }
      If the SOP talks about loans or financial needs, give credit in "Financial Justification".
      Ensure strict valid JSON output only. No markdown formatting.`;

      const userPrompt = `Here is the SOP to analyze:\n\n"${safeText}"`;

      const jsonResponse = await this.openRouterService.generateResponse(
        systemPrompt,
        userPrompt,
      );

      // Clean up markdown code blocks if present (often LLMs wrap JSON in ```json ... ```)
      const cleanJson = jsonResponse
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

      const result: SopAnalysisResult = JSON.parse(cleanJson);
      return result;
    } catch (error) {
      this.logger.error(
        'SOP Analysis with LLM failed, falling back to heuristic analysis',
        error,
      );
      return this.fallbackAnalyzeSop(safeText);
    }
  }

  // Fallback to the old logic if LLM fails
  private fallbackAnalyzeSop(text: string): SopAnalysisResult {
    const clarity = this.analyzeSopClarity(text);
    const financial = this.analyzeFinancialJustification(text);
    const careerROI = this.analyzeCareerROI(text);
    const originality = this.analyzeOriginality(text);
    const postIncome = this.analyzePostStudyIncome(text);

    const categories: SopAnalysisCategory[] = [
      {
        name: 'Clarity',
        score: Math.max(0, Math.min(20, clarity.score)),
        weight: 0.15,
      },
      {
        name: 'Financial Justification',
        score: Math.max(0, Math.min(25, financial.score)),
        weight: 0.25,
      },
      {
        name: 'Career ROI',
        score: Math.max(0, Math.min(25, careerROI.score)),
        weight: 0.25,
      },
      {
        name: 'Originality',
        score: Math.max(0, Math.min(20, originality.score)),
        weight: 0.2,
      },
      {
        name: 'Post-Study Income Clarity',
        score: Math.max(0, Math.min(10, postIncome.score)),
        weight: 0.15,
      },
    ];

    const totalScore = categories.reduce(
      (sum, cat) => sum + cat.score * cat.weight,
      0,
    );

    const allFeedback = [
      ...clarity.feedback,
      ...financial.feedback,
      ...careerROI.feedback,
      ...originality.feedback,
      ...postIncome.feedback,
    ];

    let quality: 'excellent' | 'good' | 'fair' | 'needs-work' = 'needs-work';
    if (totalScore >= 80) quality = 'excellent';
    else if (totalScore >= 65) quality = 'good';
    else if (totalScore >= 50) quality = 'fair';

    const summary = this.generateSummary(totalScore);

    return {
      totalScore,
      quality,
      categories,
      weakAreas: allFeedback,
      summary,
    };
  }

  // ... (Keeping private helper methods from original file for fallback)

  private analyzeSopClarity(text: string): {
    score: number;
    feedback: SopFeedback[];
  } {
    let score = 0;
    const feedback: SopFeedback[] = [];

    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const avgSentenceLength =
      text.split(/\s+/).length / Math.max(1, sentences.length);

    if (avgSentenceLength > 25) {
      score += 10;
      feedback.push({
        issue: 'Clarity is compromised',
        recommendation: `Simplify long sentences (avg: \${avgSentenceLength.toFixed(1)} words)`,
      });
    } else if (avgSentenceLength > 20) {
      score += 15;
    } else {
      score += 20;
    }

    const complexWords = (
      text.match(
        /\b(?:notwithstanding|aforementioned|heretofore|thereof|herewith)\b/gi,
      ) || []
    ).length;
    if (complexWords > 0) {
      feedback.push({
        issue: 'Excessive jargon detected',
        recommendation: 'Simplify technical language for better clarity',
      });
    } else {
      score += 5;
    }

    return { score, feedback };
  }

  private analyzeFinancialJustification(text: string): {
    score: number;
    feedback: SopFeedback[];
  } {
    let score = 0;
    const feedback: SopFeedback[] = [];
    const lowerText = text.toLowerCase();

    const financialKeywords = [
      'investment',
      'return',
      'cost',
      'scholarship',
      'tuition',
      'expense',
      'funding',
      'afford',
      'loan',
      'financial',
    ];
    const keywordMatches = financialKeywords.filter((k) =>
      lowerText.includes(k),
    ).length;

    if (keywordMatches >= 6) {
      score += 25;
    } else if (keywordMatches >= 4) {
      score += 18;
    } else if (keywordMatches >= 2) {
      score += 10;
      feedback.push({
        issue: 'Limited financial justification',
        recommendation:
          "Explain how the loan serves your goals and why it's a sound investment",
      });
    } else {
      feedback.push({
        issue: 'No financial justification found',
        recommendation: "Address how you'll manage costs and repay the loan",
      });
    }

    if (
      lowerText.includes('family') ||
      lowerText.includes('background') ||
      lowerText.includes('support')
    ) {
      score += 5;
    }

    return { score, feedback };
  }

  private analyzeCareerROI(text: string): {
    score: number;
    feedback: SopFeedback[];
  } {
    let score = 0;
    const feedback: SopFeedback[] = [];
    const lowerText = text.toLowerCase();

    const careerKeywords = [
      'career',
      'goal',
      'aspiration',
      'profession',
      'industry',
      'role',
      'position',
      'company',
      'opportunity',
    ];
    const careerMatches = careerKeywords.filter((k) =>
      lowerText.includes(k),
    ).length;

    if (careerMatches >= 7) {
      score += 25;
    } else if (careerMatches >= 5) {
      score += 18;
    } else if (careerMatches >= 3) {
      score += 10;
      feedback.push({
        issue: 'Career ROI unclear',
        recommendation:
          'Clearly articulate your post-study career goals and how this education enables them',
      });
    } else {
      feedback.push({
        issue: 'Missing career trajectory',
        recommendation:
          'Explain specific roles and industries you aim to work in after graduation',
      });
    }

    if (
      lowerText.includes('salary') ||
      lowerText.includes('income') ||
      lowerText.includes('earning')
    ) {
      score += 5;
    }

    if (
      lowerText.includes('skill') ||
      lowerText.includes('competence') ||
      lowerText.includes('expertise')
    ) {
      score += 5;
    }

    return { score, feedback };
  }

  private analyzeOriginality(text: string): {
    score: number;
    feedback: SopFeedback[];
  } {
    let score = 0;
    const feedback: SopFeedback[] = [];
    const lowerText = text.toLowerCase();

    const firstPersonCount = (text.match(/\bI\b|my|me\b/gi) || []).length;

    if (firstPersonCount > 30) {
      score += 15;
    } else if (firstPersonCount > 15) {
      score += 10;
    } else {
      score += 5;
      feedback.push({
        issue: 'Lacks personal voice',
        recommendation:
          'Share specific personal experiences and motivations, not generic statements',
      });
    }

    const clicheKeywords = [
      'unique opportunity',
      'passion for learning',
      'make a difference',
      'change the world',
      'leverage my skills',
    ];
    const clicheCount = clicheKeywords.filter((c) =>
      lowerText.includes(c.toLowerCase()),
    ).length;

    if (clicheCount > 3) {
      feedback.push({
        issue: 'Common clichés detected',
        recommendation:
          'Replace overused phrases with specific, personal examples',
      });
    } else {
      score += 10;
    }

    const hasNumbers = /\d+(?:%|year|degree|gpa|score)?/i.test(text);
    const hasSpecificNames =
      /(?:company|university|project|course|field):\s*[A-Z]/i.test(text);

    if (hasNumbers && hasSpecificNames) {
      score += 10;
    } else if (hasNumbers || hasSpecificNames) {
      score += 5;
    }

    return { score, feedback };
  }

  private analyzePostStudyIncome(text: string): {
    score: number;
    feedback: SopFeedback[];
  } {
    let score = 0;
    const feedback: SopFeedback[] = [];
    const lowerText = text.toLowerCase();

    const postStudyKeywords = [
      'after graduation',
      'upon completion',
      'post-study',
      'following degree',
      'after course',
    ];
    const postStudyMentioned = postStudyKeywords.some((k) =>
      lowerText.includes(k),
    );

    if (!postStudyMentioned) {
      feedback.push({
        issue: 'Post-study income clarity weak',
        recommendation:
          "Specify expected income/salary after graduation and how you'll repay the loan",
      });
    } else {
      score += 15;
    }

    if (
      lowerText.includes('salary') ||
      lowerText.includes('income') ||
      lowerText.includes('earn')
    ) {
      score += 15;
    } else {
      score += 5;
    }

    return { score, feedback };
  }

  private generateSummary(score: number): string {
    if (score >= 80) {
      return '🎯 Your SOP is compelling for loan approval. Strong financial justification, clear career goals, and personal voice make this application-ready.';
    } else if (score >= 65) {
      return '✅ Good SOP with solid structure. Focus on strengthening career ROI clarity and post-study income expectations to boost approval chances.';
    } else if (score >= 50) {
      return '⚠️ Your SOP needs revision. Prioritize adding specific financial justification and career trajectory to improve loan approval prospects.';
    } else {
      return '🔧 Significant improvements needed. Rewrite focusing on: (1) Financial necessity, (2) Career goals, (3) Personal motivation.';
    }
  }
}
