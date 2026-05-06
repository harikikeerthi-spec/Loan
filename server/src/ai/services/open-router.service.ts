import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class OpenRouterService {
  private readonly logger = new Logger(OpenRouterService.name);
  private readonly apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
  private readonly apiKey = process.env.OPENROUTER_API_KEY;

  async generateResponse(
    systemPrompt: string,
    userPrompt: string,
    temperature = 0.7,
  ): Promise<string> {
    if (!this.apiKey) {
      this.logger.warn('OPENROUTER_API_KEY is not set');
      throw new Error('API key is missing');
    }

    let attempts = 0;
    const maxAttempts = 3;
    let lastError: any;

    while (attempts < maxAttempts) {
      try {
        attempts++;
        if (attempts > 1) {
          this.logger.log(
            `Retry attempt ${attempts}/${maxAttempts} for OpenRouter API...`,
          );
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempts)); // Backoff
        }

        const response = await fetch(this.apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
            'HTTP-Referer': 'http://localhost:3000', // Required by OpenRouter
            'X-Title': 'EduLoan AI Service', // Optional, helps with tracking
          },
          body: JSON.stringify({
            model: 'google/gemini-2.0-flash-001',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            temperature: temperature,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          this.logger.error(
            `OpenRouter API error (Attempt ${attempts}): ${response.status} - ${errorText}`,
          );
          throw new Error(
            `OpenRouter API failed: ${response.statusText} - ${errorText}`,
          );
        }

        const data = await response.json();

        if (!data.choices || data.choices.length === 0) {
          this.logger.error(
            'No choices returned from OpenRouter:',
            JSON.stringify(data),
          );
          throw new Error('No completion returned from OpenRouter');
        }

        const text = data.choices[0].message?.content;
        if (!text) throw new Error('Empty text content from OpenRouter');

        return text;
      } catch (error) {
        lastError = error;
        this.logger.error(`Attempt ${attempts} failed: ${error.message}`);
        // Continue to next attempt
      }
    }

    this.logger.error('All attempts to call OpenRouter API failed', lastError);
    throw lastError;
  }
}
