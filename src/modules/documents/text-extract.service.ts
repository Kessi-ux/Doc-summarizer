// import { Injectable, BadRequestException } from '@nestjs/common';
// import * as mammoth from 'mammoth';
// const pdfParse = require('pdf-parse');

// @Injectable()
// export class TextExtractService {
//   async extract(file: Express.Multer.File): Promise<string> {
//     if (!file || !file.mimetype) {
//       throw new BadRequestException('No file provided');
//     }

//     const mime = file.mimetype.toLowerCase();

//     try {
//       if (mime === 'application/pdf') {
//         const data = await pdfParse.default(file.buffer);
//         return data.text || '';
//       }

//       if (mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
//           mime === 'application/msword' ||
//           mime.includes('word')) {
//         const result = await mammoth.extractRawText({ buffer: file.buffer });
//         return result.value || '';
//       }

//       throw new BadRequestException('Unsupported file type. Only PDF and DOCX are supported.');
//     } catch (err) {
//       // If extraction fails, return empty string for downstream handling
//       return '';
//     }
//   }
// }

import { Injectable, BadRequestException } from '@nestjs/common';
import * as mammoth from 'mammoth';
import * as fs from 'fs';
import * as path from 'path';
const pdfParse = require('pdf-parse');

@Injectable()
export class TextExtractService {
  async extract(input: Express.Multer.File | string): Promise<string> {
    // If input is a file path (string)
    if (typeof input === 'string') {
      const buffer = fs.readFileSync(input);
      const ext = path.extname(input).toLowerCase();

      try {
        if (ext === '.pdf') {
          const data = await pdfParse.default(buffer);
          return data.text || '';
        }

        if (ext === '.docx' || ext === '.doc') {
          const result = await mammoth.extractRawText({ buffer });
          return result.value || '';
        }

        throw new BadRequestException(
          'Unsupported file type. Only PDF and DOCX are supported.'
        );
      } catch (err) {
        return '';
      }
    }

    // If input is a Multer file
    if (!input || !input.mimetype) {
      throw new BadRequestException('No file provided');
    }

    const mime = input.mimetype.toLowerCase();

    try {
      if (mime === 'application/pdf') {
        const data = await pdfParse.default(input.buffer);
        return data.text || '';
      }

      if (
        mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        mime === 'application/msword' ||
        mime.includes('word')
      ) {
        const result = await mammoth.extractRawText({ buffer: input.buffer });
        return result.value || '';
      }

      throw new BadRequestException(
        'Unsupported file type. Only PDF and DOCX are supported.'
      );
    } catch (err) {
      return '';
    }
  }
}
