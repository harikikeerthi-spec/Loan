
import { Injectable } from '@nestjs/common';

@Injectable()
export class OpenRouterService {
    private readonly apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
    private readonly apiKey = process.env.OPENROUTER_API_KEY; // User must set this in .env

    async chat(prompt: string, model: string = 'arcee-ai/trinity-large-preview:free'): Promise<string> {
        if (!this.apiKey) {
            console.warn('OPENROUTER_API_KEY is not set. Using mock response or failing.');
            // For development/demo without key, we might want to throw or return a mock? 
            // Throwing is safer so user knows they need the key.
            throw new Error('OPENROUTER_API_KEY is not configured in environment variables.');
        }

        const requestBody = {
            model: model,
            messages: [
                { role: 'user', content: prompt }
            ],
        };

        console.log('OpenRouter request:', {
            url: this.apiUrl,
            model: requestBody.model,
            promptLength: prompt.length
        });

        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://loanhero.com', // Optional, for OpenRouter rankings
                    'X-Title': 'LoanHero AI', // Optional
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errorBody = await response.text();
                console.error('OpenRouter API error details:', {
                    status: response.status,
                    statusText: response.statusText,
                    body: errorBody
                });
                throw new Error(`OpenRouter API error: ${response.statusText} - ${errorBody}`);
            }

            const data = await response.json();
            return data.choices?.[0]?.message?.content || '';
        } catch (error) {
            console.error('OpenRouter request failed:', error);
            throw error;
        }
    }

    async getJson<T>(prompt: string, model: string = 'arcee-ai/trinity-large-preview:free'): Promise<T> {
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
