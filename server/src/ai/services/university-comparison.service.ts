import { Injectable, Logger } from '@nestjs/common';
import { OpenRouterService } from './open-router.service';

export interface UniversityData {
  name: string;
  rank: string;
  tuition: string;
  rate: string;
  salary: string;
  loc: string;
}

@Injectable()
export class UniversityComparisonService {
  private readonly logger = new Logger(UniversityComparisonService.name);

  constructor(private readonly openRouterService: OpenRouterService) {}

  async compare(
    uni1: string,
    uni2: string,
  ): Promise<{ uni1: UniversityData; uni2: UniversityData }> {
    try {
      const systemPrompt = `You are an expert educational consultant. 
            Compare the two universities provided. 
            Return the response in strict JSON format as an array of two objects:
            [
                {
                    "name": "University Name",
                    "rank": "Global Rank",
                    "tuition": "Annual Tuition (in local currency, e.g., £15,000)",
                    "rate": "Acceptance Rate",
                    "salary": "Avg Graduate Salary (in local currency)",
                    "loc": "City, Country"
                },
                {
                    "name": "University Name",
                    "rank": "Global Rank",
                    "tuition": "Annual Tuition (in local currency, e.g., $20,000)",
                    "rate": "Acceptance Rate",
                    "salary": "Avg Graduate Salary (in local currency)",
                    "loc": "City, Country"
                }
            ]
            Provide realistic, up-to-date estimates.
            CRITICAL: Verify if the university is a real institution.
            - Be smart about names (e.g., "University of Law" -> "The University of Law, UK").
            - Only return "Not Available" if the name is completely fictional (like "Hogwarts") or gibberish.
            - If a university exists but data is limited, provide best estimates.
            - If a university does not exist, return strict JSON object with "name": "Not Available".
            
            Ensure strict valid JSON output only. No markdown formatting.
            CRITICAL: Verify if the university is a real institution.
            - Be smart about names (e.g., "University of Law" -> "The University of Law, UK").
            - For specialized or multi-campus institutions without a single global QS/THE rank (like "The University of Law"), return "Specialized" or "N/A" for the rank. DO NOT GUESS a number.
            - Only return "Not Available" if the name is completely fictional (like "Hogwarts") or gibberish.
            - If a university exists but data is limited, provide best estimates.
            - If a university does not exist, return strict JSON object with "name": "Not Available".`;

      const userPrompt = `Compare ${uni1} and ${uni2}`;

      const jsonResponse = await this.openRouterService.generateResponse(
        systemPrompt,
        userPrompt,
        0.1,
      );
      // Improved JSON extraction
      console.log('DEBUG: Received response from LLM');
      console.log('DEBUG: Raw LLM Output:', jsonResponse);

      // Improved JSON extraction for Array or Object
      const jsonMatch = jsonResponse.match(/(\{|\[)[\s\S]*(\}|\])/);
      const cleanJson = jsonMatch ? jsonMatch[0] : jsonResponse;

      console.log('DEBUG: Cleaned JSON for parsing:', cleanJson);

      const parsed = JSON.parse(cleanJson);
      console.log('DEBUG: Successfully parsed JSON');

      // Helper to normalize keys (handle Case formatting issues from LLM)
      const normalize = (obj: any): UniversityData => {
        if (!obj)
          return {
            name: 'Unknown',
            rank: 'N/A',
            tuition: 'N/A',
            rate: 'N/A',
            salary: 'N/A',
            loc: 'Unknown',
          };
        const get = (k: string) =>
          obj[k] ||
          obj[k.toLowerCase()] ||
          obj[k.charAt(0).toUpperCase() + k.slice(1)] ||
          'N/A';

        return {
          name: get('name'),
          rank: get('rank'),
          tuition: get('tuition'),
          rate: get('rate'),
          salary: get('salary'),
          loc: get('loc') || get('location'), // Common alias
        };
      };

      let u1Raw, u2Raw;

      // Handle Array response [ {uni1}, {uni2} ]
      if (Array.isArray(parsed) && parsed.length >= 2) {
        u1Raw = parsed[0];
        u2Raw = parsed[1];
      } else if (parsed && typeof parsed === 'object') {
        if (
          parsed.universities &&
          Array.isArray(parsed.universities) &&
          parsed.universities.length >= 2
        ) {
          u1Raw = parsed.universities[0];
          u2Raw = parsed.universities[1];
        } else {
          // Handle Object response { uni1: {...}, uni2: {...} }
          u1Raw = parsed.uni1 || parsed.result?.uni1 || parsed.comparison?.uni1;
          u2Raw = parsed.uni2 || parsed.result?.uni2 || parsed.comparison?.uni2;
        }
      }

      return {
        uni1: u1Raw
          ? normalize(u1Raw)
          : {
              name: uni1,
              rank: 'N/A',
              tuition: 'N/A',
              rate: 'N/A',
              salary: 'N/A',
              loc: 'Unknown',
            },
        uni2: u2Raw
          ? normalize(u2Raw)
          : {
              name: uni2,
              rank: 'N/A',
              tuition: 'N/A',
              rate: 'N/A',
              salary: 'N/A',
              loc: 'Unknown',
            },
      };
    } catch (error) {
      console.error('CRITICAL ERROR comparing universities:', error);
      throw error;
    }
  }
}
