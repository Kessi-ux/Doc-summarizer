import { Injectable, BadRequestException } from '@nestjs/common';
import * as mammoth from 'mammoth';
const pdfParse = require('pdf-parse');

@Injectable()
export class TextExtractService {
  async extract(file: Express.Multer.File): Promise<string> {
    if (!file || !file.mimetype) {
      throw new BadRequestException('No file provided');
    }

    const mime = file.mimetype.toLowerCase();

    try {
      if (mime === 'application/pdf') {
        const data = await pdfParse.default(file.buffer);
        return data.text || '';
      }

      if (mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
          mime === 'application/msword' ||
          mime.includes('word')) {
        const result = await mammoth.extractRawText({ buffer: file.buffer });
        return result.value || '';
      }

      throw new BadRequestException('Unsupported file type. Only PDF and DOCX are supported.');
    } catch (err) {
      // If extraction fails, return empty string for downstream handling
      return '';
    }
  }
}
