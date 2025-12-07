import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { exec } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
import axios from 'axios';

@Injectable()
export class PdfService {
  async extractText(fileUrl: string): Promise<string> {
    try {
      // Download file from MinIO
      const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
      const tmpFile = `/tmp/${Date.now()}-doc.pdf`;
      writeFileSync(tmpFile, response.data);

      // Run pdftotext
      const text = await new Promise<string>((resolve, reject) => {
        exec(`pdftotext ${tmpFile} -`, (err, stdout, stderr) => {
          unlinkSync(tmpFile);
          if (err) return reject(stderr || err);
          resolve(stdout);
        });
      });

      return text;
    } catch (err) {
      console.error('PDF extraction error:', err);
      throw new InternalServerErrorException('Failed to extract PDF text');
    }
  }
}
