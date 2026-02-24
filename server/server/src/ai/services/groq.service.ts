
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
            const jsonStart = cleaned.indexOf('{');
            const jsonEnd = cleaned.lastIndexOf('}');
            if (jsonStart === -1 || jsonEnd === -1) {
                // Try array
                const arrStart = cleaned.indexOf('[');
                const arrEnd = cleaned.lastIndexOf(']');
                if (arrStart === -1 || arrEnd === -1) throw new Error('No JSON found');
                return JSON.parse(cleaned.slice(arrStart, arrEnd + 1)) as T;
            }
            return JSON.parse(cleaned.slice(jsonStart, jsonEnd + 1)) as T;
        } catch (e) {
            console.error('Failed to parse JSON response:', content);
            throw new Error('AI response was not valid JSON');
        }
    }

    async searchAdvice(query: string, type: 'university' | 'course', context?: any): Promise<any[]> {
        let prompt = '';
        if (type === 'university') {
            prompt = `Search for universities matching or relevant to "${query}". 
            Context: ${JSON.stringify(context || {})}
            Return a list of up to 12 universities.
            Each university must have: name, loc (location), slug (kebab-case name), rank (approximate world rank), accept (approximate acceptance rate %), tuition (approximate yearly tuition in USD), and country.
            
            Return ONLY a JSON array of objects.`;
        } else {
            prompt = `Search for courses/fields of study matching or relevant to "${query}".
            Context: ${JSON.stringify(context || {})}
            Return a list of up to 10 specific course names.
            
            Return ONLY a JSON array of strings.`;
        }

        return this.getJson<any[]>(prompt);
    }
}
