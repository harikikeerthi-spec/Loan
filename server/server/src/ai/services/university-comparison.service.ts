import { Injectable, NotFoundException } from '@nestjs/common';
import { GroqService } from './groq.service';

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
    constructor(private readonly groq: GroqService) { }

    async compare(
        uni1: string,
        uni2: string,
        program1?: string,
        program2?: string
    ): Promise<{ uni1: UniversityData; uni2: UniversityData }> {

        const programContext = (program1 && program2)
            ? `The comparison should focus on the "${program1}" program at ${uni1} and the "${program2}" program at ${uni2}.`
            : '';

        const prompt = `
        Compare the following two universities for their specific programs: 
        - "${uni1}" ${program1 ? `(${program1} program)` : ''}
        - "${uni2}" ${program2 ? `(${program2} program)` : ''}
        
        ${programContext}
        
        IMPORTANT: For the "rank" field, use the Webometrics Ranking (https://webometricsranking.com/) 
        which provides the most comprehensive world universities ranking based on web presence and impact.
        Format the rank as "#123" (e.g. #5, #42, #150).
        
        If specific program rankings are available (e.g. QS subject rankings, US News program rankings), 
        include them in parentheses like "#42 (CS: #15)" where CS is the program ranking.
        
        Provide program-specific data where applicable:
        - Tuition should be specific to the mentioned program if different
        - Acceptance rate for the specific program
        - Average salary for graduates of that specific program
        - Include any program-specific strengths or specializations
        
        Provide the comparison data in the following JSON format:
        {
            "uni1": {
                "name": "Full Name of ${uni1}",
                "rank": "Webometrics Rank (e.g. #5 or #42 (${program1}: #15))",
                "tuition": "Annual Tuition for ${program1 || 'this program'} (in USD or local currency)",
                "rate": "Acceptance Rate for ${program1 || 'this program'} (e.g. 5%)",
                "salary": "Avg Graduate Salary for ${program1 || 'this program'} graduates (e.g. $120,000/year)",
                "loc": "City, Country"
            },
            "uni2": {
                "name": "Full Name of ${uni2}",
                "rank": "Webometrics Rank (e.g. #8 or #55 (${program2}: #20))",
                "tuition": "Annual Tuition for ${program2 || 'this program'}",
                "rate": "Acceptance Rate for ${program2 || 'this program'}",
                "salary": "Avg Graduate Salary for ${program2 || 'this program'} graduates",
                "loc": "City, Country"
            }
        }
        
        Be accurate with latest available data. Use Webometrics (https://webometricsranking.com/) for world rankings.
        If program-specific data is not available, provide university-wide data but note it in the response.
        `;

        try {
            return await this.groq.getJson(prompt);
        } catch (error) {
            console.error('University comparison failed', error);
            throw new NotFoundException('Could not compare universities at this time.');
        }
    }

    async compareShortlist(
        shortlist: Array<{ name: string; course: string }>,
        profile: { bachelors?: string; workExp?: string; gpa?: string }
    ): Promise<any> {
        const shortlistText = shortlist.map((u, i) => `${i + 1}. ${u.name} (Program: ${u.course})`).join('\n');
        const profileText = `Bachelor's: ${profile.bachelors || 'N/A'}, Work Exp: ${profile.workExp || '0'} months, GPA: ${profile.gpa || 'N/A'}`;

        const prompt = `
        As an AI Education Consultant, provide a Deep Comparative Analysis for a student with the following profile:
        ${profileText}

        The student has shortlisted these universities:
        ${shortlistText}

        For each university, evaluate:
        1. Admissions Probability (based on profile)
        2. Program Quality (specifically for the chosen course)
        3. ROI & Career Outlook
        4. Profile Fit (How well the student's background matches the university's typical intake)

        Respond in a structured JSON format:
        {
            "summary": "Overall expert advice based on the profile and shortlist",
            "universities": [
                {
                    "name": "Full Name",
                    "course": "Program Name",
                    "admissionChance": "High/Medium/Low (with % estimate)",
                    "pros": ["Pro 1", "Pro 2"],
                    "cons": ["Con 1", "Con 2"],
                    "profileAnalysis": "Specific feedback on how the student's background fits this uni",
                    "roiScore": "Score out of 10",
                    "rank": "World Rank"
                }
            ],
            "recommendation": "Which one is the best fit and why?"
        }
        
        Provide accurate, data-driven insights. Focus on the comparability of these specific data points.
        `;

        try {
            return await this.groq.getJson(prompt);
        } catch (error) {
            console.error('Shortlist comparison failed', error);
            throw new Error('Could not compare shortlist at this time.');
        }
    }
}
