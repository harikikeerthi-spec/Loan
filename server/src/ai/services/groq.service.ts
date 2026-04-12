
import { Injectable } from '@nestjs/common';

@Injectable()
export class GroqService {
    private readonly apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
    private readonly apiKey = process.env.GROQ_API_KEY;

    async chat(prompt: string, model: string = 'llama-3.1-8b-instant'): Promise<string> {
        if (!this.apiKey) {
            console.warn('GROQ_API_KEY is not set. Using mock response or failing.');
            throw new Error('GROQ_API_KEY is not configured in environment variables.');
        }

        const requestBody: any = {
            model: model,
            messages: [
                { role: 'user', content: prompt }
            ],
            max_tokens: 2048, // Ensure we don't truncate large JSONs
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
            if (error.message.includes('429') || error.message.includes('rate_limit')) {
                console.warn('Rate limit hit. Returning mock response for stability.');
                // Return a basic mock structure if prompt looks like it wants university list
                if (prompt.includes('universities')) {
                    return JSON.stringify([{
                        name: "Stanford University (Mock)", loc: "California, USA", slug: "stanford",
                        rank: 3, accept: 4, tuition: 55000, country: "USA", description: "A top research university."
                    }]);
                }
                return "Our AI assistant is temporarily busy due to high demand. Please try again in a few minutes.";
            }
            throw error;
        }
    }

    async getJson<T>(prompt: string, model: string = 'llama-3.1-8b-instant'): Promise<T> {
        const jsonPrompt = `${prompt}\n\nIMPORTANT: Respond ONLY with valid JSON. Do not include markdown formatting.`;
        if (!this.apiKey) throw new Error('GROQ_API_KEY is not configured');

        let content = '';
        try {
            // Attempt 1: Native JSON Mode
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: model,
                    messages: [{ role: 'user', content: jsonPrompt }],
                    response_format: { type: "json_object" },
                    max_tokens: 2048,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                content = data.choices?.[0]?.message?.content || '';
            } else {
                const errorBody = await response.text();
                if (response.status === 400 && errorBody.includes('json_validate_failed')) {
                    console.warn('Native JSON mode failed. Retrying with standard mode...');
                    content = await this.chat(jsonPrompt, model);
                } else if (response.status === 429 || errorBody.includes('rate_limit')) {
                    // Fail gracefully with a fallback if searching for universities
                    if (prompt.includes('universities')) {
                        return { universities: [{ name: "University of Munich (Mock)", loc: "Munich, Germany", country: "Germany", rank: 54, tuition: 0, accept: 15, website: "https://lmu.de", slug: "lmu" }] } as any;
                    }
                    throw new Error(`Rate limit hit: ${errorBody}`);
                } else {
                    throw new Error(`Groq JSON API error: ${response.statusText} - ${errorBody}`);
                }
            }
        } catch (error) {
            console.error('Groq getJson first attempt failed:', error);
            // Absolute fallback: try standard mode one last time
            try {
                content = await this.chat(jsonPrompt, model);
            } catch (e) {
                throw error; // throw original
            }
        }

        // Processing Logic (Cleaner)
        try {
            let cleaned = content.replace(/```json/g, '').replace(/```/g, '').trim();

            // Native JSON mode sometimes gives a raw string, sometimes a quoted string. 
            // We need to find the start of the object/array
            const firstBrace = cleaned.indexOf('{');
            const firstBracket = cleaned.indexOf('[');
            let start = -1;
            let end = -1;

            if (firstBrace !== -1 && (firstBracket === -1 || (firstBrace < firstBracket && firstBrace !== -1))) {
                start = firstBrace;
                end = cleaned.lastIndexOf('}');
            } else if (firstBracket !== -1) {
                start = firstBracket;
                end = cleaned.lastIndexOf(']');
            }

            if (start === -1 || end === -1 || end < start) {
                // Return empty object if we can't find JSON and it's university list
                if (prompt.includes('universities')) return { universities: [] } as any;
                throw new Error('No valid JSON structure found in response');
            }

            let jsonString = cleaned.slice(start, end + 1);

            // EMERGENCY REPAIR: If AI returned ranges like 351-400 unquoted, fix them
            // Match : 351-400 followed by comma or brace
            jsonString = jsonString.replace(/:\s*(\d+)-(\d+)\s*(,|})/g, ': "$1-$2"$3');

            return JSON.parse(jsonString) as T;
        } catch (e) {
            console.error('Failed to parse JSON response:', content);
            // Last ditch effort for university lists
            if (prompt.includes('universities')) return { universities: [] } as any;
            throw new Error(`AI response was not valid JSON: ${e.message}`);
        }
    }

    async searchAdvice(query: string, type: 'university' | 'course' | 'ug_university', context?: any): Promise<any[]> {
        let prompt = '';
        if (type === 'university') {
            const country = context?.country || '';
            const course = context?.course || '';

            prompt = `Search for REAL, ACCREDITED universities ${query ? `matching or relevant to "${query}"` : 'that are popular'} for international students.
            ${country ? `PRIORITY: Focus PRIMARILY on universities located in "${country}".` : ''}
            ${course ? `SECONARY FOCUS: Universities strong in "${course}".` : ''}

            Context Details: ${JSON.stringify(context || {})}

            Requirement: Return a JSON object with a "universities" key.
            The "universities" key should be an array of up to 12 objects.
            For each university, provide:
            - name, loc, slug, rank, accept, tuition, country, description, website, courses

            MUST respond ONLY with JSON.`;
        } else if (type === 'ug_university') {
            prompt = `Search for REAL undergraduate degree or engineering colleges/universities matching or relevant to "${query || ''}". 
            IMPORTANT: Return ONLY colleges and universities located in INDIA. Do not include institutions from any other country.
            Return a JSON object with a "universities" key.
            The "universities" key should be an array of up to 5 objects.
            For each university, provide:
            - name, loc (City, State), pincode
            
            MUST respond ONLY with JSON.`;
        } else {
            prompt = `Search for valid courses/fields of study matching or relevant to "${query || ''}".
            Return a JSON object with a "courses" key.
            MUST respond ONLY with JSON.`;
        }

        const res = await this.getJson<any>(prompt);
        return (res.universities || res.courses || []) as any[];
    }
}
