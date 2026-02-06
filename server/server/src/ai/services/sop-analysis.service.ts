import { Injectable } from '@nestjs/common';
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
  constructor(private readonly openRouter: OpenRouterService) { }

  async analyzeSop(text: string): Promise<SopAnalysisResult> {
    const safeText = text || '';
    if (safeText.trim().length < 50) {
      return {
        totalScore: 0,
        quality: 'needs-work',
        categories: [],
        weakAreas: [{ issue: 'Text too short', recommendation: 'Provide at least 50 words for accurate analysis' }],
        summary: 'Your SOP is too short. Please provide at least 50 words for comprehensive analysis.',
      };
    }

    const prompt = `
    Analyze the following Statement of Purpose (SOP) for a university application.
    
    SOP Text:
    "${safeText}"
    
    Provide a detailed analysis in JSON format with the following structure:
    {
      "totalScore": number (0-100),
      "quality": string ("excellent", "good", "fair", "needs-work"),
      "categories": [
        { "name": "Clarity", "score": number (0-20), "weight": 0.2 },
        { "name": "Financial Justification", "score": number (0-20), "weight": 0.2 },
        { "name": "Career ROI", "score": number (0-20), "weight": 0.2 },
        { "name": "Originality", "score": number (0-20), "weight": 0.2 },
        { "name": "Structure", "score": number (0-20), "weight": 0.2 }
      ],
      "weakAreas": [
        { "issue": "string", "recommendation": "string" }
      ],
      "summary": "string"
    }

    Evaluate based on clarity, financial planning mention, career goals, personal story, and flow.
    If the SOP is missing financial details (how they will fund it), penalize the Financial Justification score.
    `;

    try {
      return await this.openRouter.getJson<SopAnalysisResult>(prompt);
    } catch (error) {
      console.error('SOP Analysis failed', error);
      // Fallback or error rethrow
      throw error;
    }
  }
}
