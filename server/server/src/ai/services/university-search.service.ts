import { Injectable } from '@nestjs/common';
import { GroqService } from './groq.service';

export interface University {
  name: string;
  country: string;
  city?: string;
  ranking?: number;
  worldRanking?: number;
  type?: string;
  website?: string;
  description?: string;
  popularCourses?: string[];
  averageFees?: string;
  acceptanceRate?: number;
  scholarships?: boolean;
  logoUrl?: string;
  imageUrl?: string;
  isFeatured?: boolean;
}

export interface UniversityDetails extends University {
  admissionRequirements?: {
    minGPA?: string;
    testScores?: string[];
    languageRequirements?: string[];
  };
  programs?: Array<{
    name: string;
    description?: string;
    tuition?: string;
  }>;
  employmentStats?: {
    employmentRate?: number;
    averageSalary?: string;
    topEmployers?: string[];
  };
}

@Injectable()
export class UniversitySearchService {
  constructor(private readonly groqService: GroqService) { }

  /**
   * Search universities by country using AI
   * @param countries Array of country names
   * @param limit Maximum number of universities to return per country
   * @returns Array of universities found
   */
  async searchUniversitiesByCountry(
    countries: string[],
    limit: number = 10,
  ): Promise<University[]> {
    if (!countries || countries.length === 0) {
      throw new Error('At least one country must be provided');
    }

    const countriesStr = countries.join(', ');

    const prompt = `You are an expert in international education and university rankings. Your task is to list REAL, ACCREDITED universities in the following countries: ${countriesStr}

For each country, list approximately ${limit} top universities that actually exist and are well-known.

Return a JSON array with the following structure for each university:
[
  {
    "name": "Full University Name",
    "loc": "City, Country",
    "country": "Country Name",
    "rank": 15,
    "worldRanking": 150,
    "type": "Public/Private",
    "website": "https://example.com",
    "description": "Brief description of the university",
    "courses": ["Engineering", "Business", "Medicine"],
    "tuition": 25000,
    "accept": 15,
    "min_gpa": 7.5,
    "min_ielts": 6.5,
    "min_toefl": 90,
    "scholarships": true,
    "loan": true
  }
]

Important:
- ONLY include REAL universities that actually exist
- "rank" should be the world QS ranking (integer)
- "accept" should be the acceptance rate percentage as an integer (e.g., 15 for 15%)
- "tuition" should be the approximate annual tuition in USD as an integer (e.g., 25000)
- "min_gpa" should be on a 10.0 scale (float)
- Return ONLY valid JSON array, no markdown or extra text`;

    try {
      const universities = await this.groqService.getJson<University[]>(prompt);

      // Validate and filter results
      const validUniversities = universities.filter(uni =>
        uni.name && uni.country && typeof uni.name === 'string' && typeof uni.country === 'string'
      );

      return validUniversities;
    } catch (error) {
      console.error('University search failed:', error);
      throw new Error(`Failed to search universities: ${error.message}`);
    }
  }

  /**
   * Get detailed information about a specific university
   * @param universityName Name of the university
   * @param country Country where the university is located
   * @returns Detailed university information
   */
  async getUniversityDetailsFull(
    universityName: string,
    country: string,
  ): Promise<UniversityDetails> {
    if (!universityName || !country) {
      throw new Error('University name and country are required');
    }

    const prompt = `You are an expert in international education. Provide comprehensive, accurate information about ${universityName} in ${country}.

Return detailed information as a JSON object with this structure:
{
  "name": "Full University Name",
  "country": "Country",
  "city": "City",
  "ranking": 15,
  "worldRanking": 150,
  "type": "Public/Private/Research",
  "website": "https://...",
  "description": "Detailed description",
  "popularCourses": ["Course1", "Course2", "Course3"],
  "averageFees": "Tuition range per year",
  "acceptanceRate": 15,
  "scholarships": true,
  "admissionRequirements": {
    "minGPA": "3.5 or equivalent",
    "testScores": ["GMAT", "GRE"],
    "languageRequirements": ["TOEFL 90+", "IELTS 6.5+"]
  },
  "programs": [
    {
      "name": "Program Name",
      "description": "Program details",
      "tuition": "Annual tuition"
    }
  ],
  "employmentStats": {
    "employmentRate": 95,
    "averageSalary": "Average graduate salary",
    "topEmployers": ["Company1", "Company2", "Company3"]
  }
}

Provide accurate, real information based on the university's actual details. Return ONLY valid JSON, no markdown or extra text.`;

    try {
      const details = await this.groqService.getJson<UniversityDetails>(prompt);
      return details;
    } catch (error) {
      console.error('Failed to fetch university details:', error);
      throw new Error(`Failed to fetch details for ${universityName}: ${error.message}`);
    }
  }

  /**
   * Validate that universities are real and not fictional
   * @param universities Array of universities to validate
   * @returns Array of validated universities
   */
  async validateUniversityRealness(universities: University[]): Promise<University[]> {
    if (!universities || universities.length === 0) {
      return [];
    }

    // Create a validation prompt
    const universityNames = universities.map(u => `${u.name} (${u.country})`).join(', ');

    const prompt = `You are an expert in international education and university rankings.

Review the following list of universities and identify which ones are REAL, ACCREDITED institutions that actually exist:

${universityNames}

For each university, respond with ONLY a JSON array of objects with this structure:
[
  {
    "name": "University Name",
    "country": "Country",
    "isReal": true/false,
    "confidence": 0.95
  }
]

Return ONLY the JSON array with validation results. No other text.`;

    try {
      const validationResults = await this.groqService.getJson<
        Array<{ name: string; country: string; isReal: boolean; confidence: number }>
      >(prompt);

      // Filter universities based on validation
      const realUniversities = universities.filter(uni => {
        const validation = validationResults.find(
          v => v.name.toLowerCase() === uni.name.toLowerCase() &&
            v.country.toLowerCase() === uni.country.toLowerCase(),
        );
        return validation ? validation.isReal && validation.confidence > 0.8 : true; // Fail permissive
      });

      return realUniversities;
    } catch (error) {
      console.error('University validation failed:', error);
      // Fail permissive - return all if validation fails
      return universities;
    }
  }

  /**
   * Get list of popular countries for education
   * @returns Array of country names
   */
  async getPopularCountries(): Promise<string[]> {
    const prompt = `List the top 15 most popular countries for international students seeking higher education. Return ONLY a JSON array of country names, nothing else.

Example format:
["United States", "United Kingdom", "Canada", "Australia", ...]

Return ONLY the JSON array.`;

    try {
      const countries = await this.groqService.getJson<string[]>(prompt);
      return Array.isArray(countries) ? countries : [];
    } catch (error) {
      console.error('Failed to fetch popular countries:', error);
      // Return default popular countries if AI fails
      return [
        'United States',
        'United Kingdom',
        'Canada',
        'Australia',
        'Germany',
        'France',
        'Netherlands',
        'Switzerland',
        'Singapore',
        'Japan',
        'New Zealand',
        'Sweden',
        'Ireland',
        'Spain',
        'Italy',
      ];
    }
  }
}
