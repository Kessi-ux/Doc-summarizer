// import { Injectable, NotFoundException } from '@nestjs/common';
// import { PrismaService } from '../../prisma/prisma.service';
// import { S3Service } from './s3.services';
// import { TextExtractService } from './text-extract.service';
// import { LlmService } from './lim.services';

// @Injectable()
// export class DocumentsService {
//   constructor(
//     private prisma: PrismaService,
//     private s3: S3Service,
//     private extractor: TextExtractService,
//     private llm: LlmService,
//   ) {}

//   async uploadFile(file: Express.Multer.File) {
//     // Upload raw file to S3/MinIO
//     const { key, url } = await this.s3.upload(file);

//     // Extract text
//     const extractedText = await this.extractor.extract(file);
//     console.log("EXTRACTED TEXT:", extractedText?.slice(0, 300));

//     // Save record
//     const doc = await this.prisma.document.create({
//       data: {
//         filename: file.originalname,
//         fileUrl: url,
//         extractedText,
//       },
//     });

//     return doc;
//   }

//   async analyzeDocument(id: string) {
//     const doc = await this.prisma.document.findUnique({ where: { id } });
//     if (!doc) throw new NotFoundException('Document not found');

//     const analysis = await this.llm.analyze(doc.extractedText || '');

//     const updated = await this.prisma.document.update({
//       where: { id },
//       data: {
//         summary: analysis.summary,
//         docType: analysis.docType,
//         metadata: analysis.metadata,
//       },
//     });

//     return updated;
//   }

//   async getDocument(id: string) {
//     const doc = await this.prisma.document.findUnique({ where: { id } });
//     if (!doc) throw new NotFoundException('Document not found');
//     return doc;
//   }
// }

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { S3Service } from './s3.services';
import { TextExtractService } from './text-extract.service';
import { PdfService } from './pdf.service';
import { LlmService } from './lim.services';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

@Injectable()
export class DocumentsService {
  constructor(
    private prisma: PrismaService,
    private s3: S3Service,
    private extractor: TextExtractService,
    private llm: LlmService,
    private pdfService: PdfService
  ) {}

  async uploadFile(file: Express.Multer.File) {
    // Upload raw file to S3/MinIO
    const { key, url } = await this.s3.upload(file);

    // Save record first with empty extractedText
    const doc = await this.prisma.document.create({
      data: {
        filename: file.originalname,
        fileUrl: url,
        extractedText: '',
      },
    });

    return doc;
  }

  async analyzeDocument(documentId: string) {
    const doc = await this.prisma.document.findUnique({ where: { id: documentId } });
    if (!doc) throw new NotFoundException('Document not found');

    // 1️⃣ Download the file locally
    // const tempPath = path.join(__dirname, `${id}.pdf`);
    // const writer = fs.createWriteStream(tempPath);
    // const response = await axios.get(doc.fileUrl, { responseType: 'stream' });
    // response.data.pipe(writer);

    // await new Promise<void>((resolve, reject) => {
    //   writer.on('finish', () => resolve());
    //   writer.on('error', (err) => reject(err));
    // });

    // 2️⃣ Extract text
    // const extractedText = await this.extractor.extract(tempPath);
    // console.log("EXTRACTED TEXT:", extractedText?.slice(0, 300));

    // // 3️⃣ Call LLM
    // const analysis = await this.llm.analyze(extractedText || '');

    // // 4️⃣ Save everything back to DB
    // const updated = await this.prisma.document.update({
    //   where: { id },
    //   data: {
    //     extractedText,
    //     summary: analysis.summary,
    //     docType: analysis.docType,
    //     metadata: analysis.metadata,
    //   },
    // });

    // // 5️⃣ Optional: delete temp file
    // fs.unlinkSync(tempPath);

    // return updated;

    // Extract text
    const extractedText = await this.pdfService.extractText(doc.fileUrl);

    // Call LLM
    const analysis = await this.llm.analyze(extractedText || '');

    // Update DB
    const updated = await this.prisma.document.update({
      where: { id: documentId },
      data: {
        extractedText,
        summary: analysis.summary,
        docType: analysis.docType,
        metadata: analysis.metadata,
      },
  });
    return updated;
  }

  async getDocument(id: string) {
    const doc = await this.prisma.document.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }
}
