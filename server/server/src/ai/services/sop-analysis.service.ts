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

    const prompt = `
    You are an expert SOP analyzer specializing in detecting AI-generated content and ensuring authentic human writing.
    
    CRITICAL MISSION: Ensure this SOP reads as if written by a real human, not AI. Be EXTREMELY STRICT with humanize scoring.
    
    SOP Text:
    "${safeText}"
    
    Provide a detailed analysis in JSON format with the following structure:
    {
      "totalScore": number (0-100),
      "quality": string ("excellent", "good", "fair", "needs-work"),
      "humanizeScore": number (0-100, BE VERY STRICT - only 90-100 if genuinely human-like. Most AI-generated content should score 40-70),
      "plagiarismScore": number (0-100, where 0-15 means highly original),
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
      "summary": "string - overall assessment and critical next steps",
      "humanizeFeedback": "string - DETAILED, SPECIFIC advice on making the writing authentic and human. Point out ANY AI-like patterns. Be brutally honest about what sounds robotic or generic. Provide concrete examples of how to add personal voice, natural flow, emotional depth, and unique perspectives.",
      "plagiarismFeedback": "string - specific feedback on originality with examples of generic phrases to replace"
    }

    ═══════════════════════════════════════════════════════════════════
    HUMANIZE SCORE - STRICT EVALUATION CRITERIA (BE HARSH):
    ═══════════════════════════════════════════════════════════════════
    
    ✅ SCORE 95-100 (EXCEPTIONAL - CLEARLY HUMAN):
    Required characteristics (ALL must be present):
    - Specific, named personal stories with dates, places, people
    - Emotional vulnerability and authentic struggles mentioned
    - Varied sentence lengths (mix of 5-word and 25+ word sentences)
    - Natural speech patterns ("I realized...", "This made me...", "I wondered...")
    - Unique metaphors or comparisons from personal experience
    - Conversational asides or reflections
    - Imperfect, natural phrasing (not overly polished)
    - Unexpected word choices that feel authentic
    - Clear personality and voice (humor, passion, curiosity)
    
    ✅ SCORE 85-94 (VERY GOOD - MOSTLY HUMAN):
    - Some personal stories but could be more specific
    - Generally natural flow with occasional stiff phrases
    - Good sentence variety but not exceptional
    - Authentic voice present but could be stronger
    - Minor AI-like patterns (1-2 instances)
    
    ⚠️ SCORE 70-84 (ADEQUATE - NEEDS HUMANIZATION):
    - Limited personal details or generic stories
    - Some robotic phrasing or formal language
    - Repetitive sentence structures
    - Lacks emotional depth
    - Multiple AI-detection red flags (3-5 instances)
    
    ❌ SCORE 40-69 (LIKELY AI-GENERATED):
    Red flags indicating AI generation:
    - Starts with generic openings like "In today's world..." or "Throughout history..."
    - Excessive use of transition words ("Furthermore", "Moreover", "Additionally")
    - Overly balanced structure (every paragraph same length)
    - Perfect grammar with no natural imperfections
    - Generic phrases: "passionate about", "global citizen", "make a difference"
    - Lists achievements without personal reflection
    - No specific dates, names, or unique details
    - Sounds like a template or essay generator
    - Formal, academic tone throughout (no personality)
    
    ❌ SCORE 0-39 (DEFINITELY AI OR TEMPLATE):
    - Obviously template-based
    - Robotic, mechanical tone
    - Zero personalization
    - Generic statements only
    - No authentic voice
    
    ═══════════════════════════════════════════════════════════════════
    PLAGIARISM SCORE CRITERIA:
    ═══════════════════════════════════════════════════════════════════
    
    ✅ 0-15% (HIGHLY ORIGINAL):
    - Unique personal experiences with specific details
    - Original phrasing and metaphors
    - No common clichés or templates
    
    ⚠️ 30-50% (SOME GENERIC CONTENT):
    - Mix of personal and generic content
    - Some overused phrases detected
    
    ❌ 60-100% (LOW ORIGINALITY):
    - Heavy template usage
    - Common clichés and phrases
    - Minimal personalization
    
    ═══════════════════════════════════════════════════════════════════
    FEEDBACK REQUIREMENTS:
    ═══════════════════════════════════════════════════════════════════
    
    In humanizeFeedback, you MUST:
    1. Point out SPECIFIC AI-like phrases or patterns if found
    2. Identify which sentences sound generic or robotic
    3. Suggest replacing generic statements with personal stories
    4. Recommend adding specific details (dates, names, moments)
    5. Explain how to vary sentence structure naturally
    6. Encourage emotional authenticity and vulnerability
    7. Suggest removing overly formal or academic language
    8. Provide examples of more natural phrasing
    
    Example good feedback:
    "Your opening 'In today's rapidly evolving technological landscape' is a common AI-generated phrase. Replace it with a specific moment, like 'When I first debugged my school's website at age 15, I realized...' Your sentences are uniformly 15-20 words - try varying from short (5-7 words) to longer, flowing ones (25-30 words). Add emotional context: instead of 'I developed an interest in AI', try 'Watching my grandmother struggle with her smartphone made me passionate about creating intuitive AI interfaces.'"
    
    ═══════════════════════════════════════════════════════════════════
    
    BE STRICT. Most SOPs should score 60-80 on humanize. Only truly exceptional, deeply personal writing gets 90+.
    Help users create SOPs that admission officers will believe were written by a real person with genuine experiences.
    `;

    try {
      return await this.groq.getJson<SopAnalysisResult>(prompt);
    } catch (error) {
      console.error('SOP Analysis failed', error);
      // Fallback or error rethrow
      throw error;
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
