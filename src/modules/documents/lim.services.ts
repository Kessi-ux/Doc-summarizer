import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { GoogleGenerativeAI, GenerationConfig } from '@google/generative-ai';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class LlmService {
  private apiKey = process.env.GEMINI_API_KEY;
  private systemPrompt = `
You are a document analysis assistant. Respond STRICTLY with a single JSON object (no surrounding text) with keys:
{
  "summary": "<concise summary, 1-3 sentences>",
  "docType": "<one of: invoice, cv, resume, report, letter, contract, other>",
  "metadata": {
    "date": "<ISO date if found or empty>",
    "sender": "<sender name/email or empty>",
    "receiver": "<receiver name/email or empty>",
    "total": "<numeric total if found or empty>",
    "invoice_number": "<if present or empty>"
  }
}
If you cannot find a field, return an empty string for it.
`;

  async analyze(text: string): Promise<{ summary: string; docType: string; metadata: any }> {
    try {
      if (!this.apiKey) {
        throw new Error('GEMINI_API_KEY not defined in .env');
      }

      const genAI = new GoogleGenerativeAI(this.apiKey);
      const generationConfig: GenerationConfig = {
        responseMimeType: 'application/json',
      };

      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash', 
        generationConfig,
      });

      const prompt = `
          ${this.systemPrompt}

      Text to process:
      """
      ${text.slice(0, 50000)}
      """
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const content = await response.text();

      let parsed;
      try {
        parsed = JSON.parse(content);
      } catch (e) {
        const jsonMatch = content.match(/\{[\s\S]*\}$/m);
        if (jsonMatch) {
          try {
            parsed = JSON.parse(jsonMatch[0]);
          } catch (e2) {
            parsed = null;
          }
        }
      }

      if (!parsed) {
        return { summary: '', docType: 'other', metadata: {} };
      }

      return {
        summary: parsed.summary ?? '',
        docType: parsed.docType ?? 'other',
        metadata: parsed.metadata ?? {},
      };
    } catch (err) {
      console.error('Error in LLM analysis:', err);
      throw new InternalServerErrorException('LLM analysis failed');
    }
  }
}
