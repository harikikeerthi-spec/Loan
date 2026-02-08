
import { Injectable } from '@nestjs/common';

@Injectable()
export class GrokService {
    private readonly apiUrl = 'https://api.x.ai/v1/chat/completions';
    private readonly apiKey = process.env.GROK_API_KEY; // User must set this in .env

    async chat(prompt: string, model: string = 'grok-beta'): Promise<string> {
        if (!this.apiKey) {
            console.warn('GROK_API_KEY is not set. Using mock response or failing.');
            // For development/demo without key, we might want to throw or return a mock? 
            // Throwing is safer so user knows they need the key.
            throw new Error('GROK_API_KEY is not configured in environment variables.');
        }

        const requestBody = {
            model: model,
            messages: [
                { role: 'user', content: prompt }
            ],
        };

        const maskedKey = this.apiKey ? `${this.apiKey.slice(0, 4)}...${this.apiKey.slice(-4)} (len ${this.apiKey.length})` : '[NOT SET]';
        console.log('Grok request:', {
            url: this.apiUrl,
            model: requestBody.model,
            promptLength: prompt.length,
            grokKey: maskedKey
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
                console.error('Grok API error details:', {
                    status: response.status,
                    statusText: response.statusText,
                    body: errorBody
                });
                throw new Error(`Grok API error: ${response.statusText} - ${errorBody}`);
            }

            const data = await response.json();
            return data.choices?.[0]?.message?.content || '';
        } catch (error) {
            console.error('Grok request failed:', error);
            throw error;
        }
    }

    async getJson<T>(prompt: string, model: string = 'grok-beta'): Promise<T> {
        const jsonPrompt = `${prompt}\n\nIMPORTANT: Respond ONLY with valid JSON. Do not include markdown formatting like \`\`\`json.`;
        const content = await this.chat(jsonPrompt, model);
        try {
            // Clean up common markdown json wrappers if present
            const cleaned = content.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleaned) as T;
        } catch (e) {
            console.error('Failed to parse JSON response:', content);
            throw new Error('AI response was not valid JSON');
        }
    }
}
