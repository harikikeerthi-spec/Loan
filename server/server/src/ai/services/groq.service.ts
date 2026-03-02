
import { Injectable } from '@nestjs/common';

@Injectable()
export class GroqService {
    private readonly apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
    private readonly apiKey = process.env.GROQ_API_KEY;

    async chat(prompt: string, model: string = 'llama-3.3-70b-versatile'): Promise<string> {
        if (!this.apiKey) {
            console.warn('GROQ_API_KEY is not set. Using mock response or failing.');
            throw new Error('GROQ_API_KEY is not configured in environment variables.');
        }

        const requestBody = {
            model: model,
            messages: [
                { role: 'user', content: prompt }
            ],
        };

        const maskedKey = this.apiKey ? `${this.apiKey.slice(0, 4)}...${this.apiKey.slice(-4)} (len ${this.apiKey.length})` : '[NOT SET]';
        console.log('Groq request:', {
            url: this.apiUrl,
            model: requestBody.model,
            promptLength: prompt.length,
            groqKey: maskedKey
        });

        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errorBody = await response.text();
                console.error('Groq API error details:', {
                    status: response.status,
                    statusText: response.statusText,
                    body: errorBody
                });
                throw new Error(`Groq API error: ${response.statusText} - ${errorBody}`);
            }

            const data = await response.json();
            return data.choices?.[0]?.message?.content || '';
        } catch (error) {
            console.error('Groq request failed:', error);
            throw error;
        }
    }

    async getJson<T>(prompt: string, model: string = 'llama-3.3-70b-versatile'): Promise<T> {
        const jsonPrompt = `${prompt}\n\nIMPORTANT: Respond ONLY with valid JSON. Do not include markdown formatting like \`\`\`json.`;
        const content = await this.chat(jsonPrompt, model);
        try {
            // Clean up common markdown json wrappers if present
            const cleaned = content.replace(/```json/g, '').replace(/```/g, '').trim();

            // Find the outermost structure: either { ... } or [ ... ]
            const firstBrace = cleaned.indexOf('{');
            const firstBracket = cleaned.indexOf('[');

            let start = -1;
            let end = -1;

            if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
                // Object starts first
                start = firstBrace;
                end = cleaned.lastIndexOf('}');
            } else if (firstBracket !== -1) {
                // Array starts first
                start = firstBracket;
                end = cleaned.lastIndexOf(']');
            }

            if (start === -1 || end === -1 || end < start) {
                throw new Error('No valid JSON structure ({ or [) found in response');
            }

            const jsonString = cleaned.slice(start, end + 1);
            return JSON.parse(jsonString) as T;
        } catch (e) {
            console.error('Failed to parse JSON response:', content);
            throw new Error(`AI response was not valid JSON: ${e.message}`);
        }
    }

    async searchAdvice(query: string, type: 'university' | 'course', context?: any): Promise<any[]> {
        let prompt = '';
        if (type === 'university') {
            const country = context?.country || '';
            const course = context?.course || '';

            prompt = `Search for REAL, ACCREDITED universities ${query ? `matching or relevant to "${query}"` : 'that are popular'} for international students.
            ${country ? `PRIORITY: Focus PRIMARILY on universities located in "${country}".` : ''}
            ${course ? `SECONARY FOCUS: Universities strong in "${course}".` : ''}
            
            Context Details: ${JSON.stringify(context || {})}
            
            Requirement: Return a list of up to 12 universities.
            For each university, provide: 
            - name: Full official name
            - loc: city, country
            - slug: kebab-case name
            - rank: approximate world QS rank (integer)
            - accept: approximate acceptance rate % (integer)
            - tuition: approximate yearly tuition in USD (integer)
            - country: full country name
            - description: short one-liner about the university
            - website: official website URL
            - courses: array of 3-5 relevant master's programs
            
            Return ONLY a JSON array of objects.`;
        } else {
            prompt = `Search for valid courses/fields of study matching or relevant to "${query || ''}".
            Context of interest: ${JSON.stringify(context || {})}
            Return a list of up to 15 specific and standard course names.
            
            Return ONLY a JSON array of strings.`;
        }

        return this.getJson<any[]>(prompt);
    }
}
