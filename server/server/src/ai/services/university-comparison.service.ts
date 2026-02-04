import { Injectable, NotFoundException } from '@nestjs/common';

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
    private readonly uniData: Record<string, UniversityData> = {
        harvard: {
            name: 'Harvard University',
            rank: '#1',
            tuition: '$57,261',
            rate: '3.4%',
            salary: '$147,000',
            loc: 'Cambridge, USA',
        },
        stanford: {
            name: 'Stanford University',
            rank: '#3',
            tuition: '$61,731',
            rate: '3.9%',
            salary: '$153,000',
            loc: 'Stanford, USA',
        },
        mit: {
            name: 'MIT',
            rank: '#1',
            tuition: '$59,750',
            rate: '4.0%',
            salary: '$158,000',
            loc: 'Cambridge, USA',
        },
        oxford: {
            name: 'University of Oxford',
            rank: '#5',
            tuition: '£39,010',
            rate: '17.5%',
            salary: '£65,000',
            loc: 'Oxford, UK',
        },
        cambridge: {
            name: 'University of Cambridge',
            rank: '#2',
            tuition: '£42,000',
            rate: '21%',
            salary: '£68,000',
            loc: 'Cambridge, UK',
        },
        toronto: {
            name: 'University of Toronto',
            rank: '#21',
            tuition: 'CAD 60,000',
            rate: '43%',
            salary: 'CAD 85,000',
            loc: 'Toronto, Canada',
        },
        melbourne: {
            name: 'University of Melbourne',
            rank: '#14',
            tuition: 'AUD 48,000',
            rate: '70%',
            salary: 'AUD 75,000',
            loc: 'Melbourne, Australia',
        },
    };

    compare(uni1: string, uni2: string): { uni1: UniversityData; uni2: UniversityData } {
        const u1 = this.uniData[uni1.toLowerCase()];
        const u2 = this.uniData[uni2.toLowerCase()];

        if (!u1 || !u2) {
            throw new NotFoundException('One or both universities not found');
        }

        return { uni1: u1, uni2: u2 };
    }
}
