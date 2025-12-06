import { Injectable, InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class LlmService {
  private endpoint = 'https://openrouter.ai/api/v1/chat/completions';
  private apiKey = process.env.OPEN_ROUTER_API_KEY;

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
      const prompt = [
        { role: 'system', content: this.systemPrompt },
        { role: 'user', content: text.slice(0, 50000) } // safety cut
      ];

      const resp = await axios.post(this.endpoint, {
        model: 'gpt-4o-mini',
        messages: prompt,
        max_tokens: 800,
        temperature: 0.0,
      }, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 120000,
      });

      // The API may return choices -> message.content
      const content = resp.data?.choices?.[0]?.message?.content ?? resp.data?.choices?.[0]?.text ?? '';

      // Try safe JSON parse, else attempt to extract JSON substring
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
        // fallback minimal structure
        return { summary: '', docType: 'other', metadata: {} };
      }

      return {
        summary: parsed.summary ?? '',
        docType: parsed.docType ?? 'other',
        metadata: parsed.metadata ?? {},
      };
    } catch (err) {
      throw new InternalServerErrorException('LLM analysis failed');
    }
  }
}
