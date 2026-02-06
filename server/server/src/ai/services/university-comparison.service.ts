import { Injectable, NotFoundException } from '@nestjs/common';
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
    constructor(private readonly openRouter: OpenRouterService) { }

    async compare(uni1: string, uni2: string): Promise<{ uni1: UniversityData; uni2: UniversityData }> {
        const prompt = `
        Compare the following two universities: "${uni1}" and "${uni2}".
        
        Provide the comparison data in the following JSON format:
        {
            "uni1": {
                "name": "Full Name of Uni 1",
                "rank": "Global Rank (e.g. #5)",
                "tuition": "Annual Tuition (approx in local currency)",
                "rate": "Acceptance Rate (e.g. 5%)",
                "salary": "Avg Graduate Salary",
                "loc": "City, Country"
            },
            "uni2": {
                "name": "Full Name of Uni 2",
                "rank": "Global Rank",
                "tuition": "Annual Tuition",
                "rate": "Acceptance Rate",
                "salary": "Avg Graduate Salary",
                "loc": "City, Country"
            }
        }
        
        Be accurate with latest available data.
        `;

        try {
            return await this.openRouter.getJson(prompt);
        } catch (error) {
            console.error('University comparison failed', error);
            // Fallback for demo if offline or error, providing generic data or throwing
            throw new NotFoundException('Could not compare universities at this time.');
        }
    }
}
