import { Injectable } from '@nestjs/common';
import { GroqService } from './groq.service';

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
  humanizeScore: number; // 0-100, higher is more human-like
  plagiarismScore: number; // 0-100, lower is better (more original)
  categories: SopAnalysisCategory[];
  weakAreas: SopFeedback[];
  summary: string;
  humanizeFeedback: string; // Feedback on how to make it more human
  plagiarismFeedback: string; // Feedback on originality
}

@Injectable()
export class SopAnalysisService {
  constructor(private readonly groq: GroqService) { }

  async analyzeSop(text: string): Promise<SopAnalysisResult> {
    const safeText = text || '';
    if (safeText.trim().length < 50) {
      return {
        totalScore: 0,
        quality: 'needs-work',
        humanizeScore: 0,
        plagiarismScore: 100,
        categories: [],
        weakAreas: [{ issue: 'Text too short', recommendation: 'Provide at least 50 words for accurate analysis' }],
        summary: 'Your SOP is too short. Please provide at least 50 words for comprehensive analysis.',
        humanizeFeedback: 'Not enough content to analyze writing style.',
        plagiarismFeedback: 'Not enough content to check originality.',
      };
    }

    // Truncate SOP text to ~2000 chars to stay within Groq free-tier 6000 TPM limit
    const truncatedText = safeText.length > 2000 ? safeText.slice(0, 2000) + '...[truncated]' : safeText;

    const prompt = `You are an expert SOP analyzer. Analyze this SOP for quality, AI-detection, and originality. Be strict with humanize scoring (most AI text scores 40-70).

SOP Text:
"${truncatedText}"

Respond ONLY with this JSON:
{
  "totalScore": number (0-100),
  "quality": "excellent"|"good"|"fair"|"needs-work",
  "humanizeScore": number (0-100, strict: 90+ only for genuinely human writing with personal stories, varied sentences, emotional depth),
  "plagiarismScore": number (0-100, 0=original, 100=copied),
  "categories": [
    {"name":"Clarity","score":number(0-20),"weight":0.2},
    {"name":"Financial Justification","score":number(0-20),"weight":0.2},
    {"name":"Career ROI","score":number(0-20),"weight":0.2},
    {"name":"Originality","score":number(0-20),"weight":0.2},
    {"name":"Structure","score":number(0-20),"weight":0.2}
  ],
  "weakAreas": [{"issue":"string","recommendation":"string"}],
  "summary": "brief overall assessment",
  "humanizeFeedback": "specific advice: point out AI-like phrases, suggest personal stories, recommend varied sentence lengths and emotional authenticity",
  "plagiarismFeedback": "feedback on originality with examples of generic phrases to replace"
}`;

    try {
      return await this.groq.getJson<SopAnalysisResult>(prompt);
    } catch (error) {
      console.error('SOP Analysis failed', error);
      // Return a graceful fallback instead of crashing
      return {
        totalScore: 0,
        quality: 'needs-work' as const,
        humanizeScore: 0,
        plagiarismScore: 0,
        categories: [
          { name: 'Clarity', score: 0, weight: 0.2 },
          { name: 'Financial Justification', score: 0, weight: 0.2 },
          { name: 'Career ROI', score: 0, weight: 0.2 },
          { name: 'Originality', score: 0, weight: 0.2 },
          { name: 'Structure', score: 0, weight: 0.2 },
        ],
        weakAreas: [{ issue: 'AI service unavailable', recommendation: 'Our AI service is temporarily at capacity. Please try again in a minute.' }],
        summary: 'Analysis could not be completed due to high demand. Please try again shortly.',
        humanizeFeedback: 'Unable to analyze at this time. Please retry.',
        plagiarismFeedback: 'Unable to analyze at this time. Please retry.',
      };
    }
  }

  async humanizeSop(text: string): Promise<{ humanizedText: string; improvements: string[] }> {
    const prompt = `
    You are an expert humanizer and editor. Your task is to take an AI-generated Statement of Purpose (SOP) and rewrite it to sound 100% human-written.
    
    CRITICAL INSTRUCTIONS:
    1. Eliminate all AI-like "perfect" sentence structures.
    2. Add specific, believable (but generic enough to be adapted) personal anecdotes and small details.
    3. Use varied sentence lengths (short punches mixed with longer reflections).
    4. Use more natural, conversational transition words (avoid "Furthermore", "Moreover", "Additionally").
    5. Add emotional depth, vulnerability, and a unique personal voice.
    6. Ensure the tone is professional but authentically human.
    7. DO NOT use the phrase "In today's world" or similar clichés.
    
    Original AI-Generated SOP:
    "${text}"
    
    Provide your response in JSON format:
    {
      "humanizedText": "string - the complete rewritten SOP",
      "improvements": ["string", "string", "string"] - list of key changes made to humanize it
    }
    `;

    try {
      return await this.groq.getJson<{ humanizedText: string; improvements: string[] }>(prompt);
    } catch (error) {
      console.error('SOP Humanization failed', error);
      throw error;
    }
  }
}
