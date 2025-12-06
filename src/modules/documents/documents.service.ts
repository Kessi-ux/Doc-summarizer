import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { S3Service } from './s3.services';
import { TextExtractService } from './text-extract.service';
import { LlmService } from './lim.services';

@Injectable()
export class DocumentsService {
  constructor(
    private prisma: PrismaService,
    private s3: S3Service,
    private extractor: TextExtractService,
    private llm: LlmService,
  ) {}

  async uploadFile(file: Express.Multer.File) {
    // Upload raw file to S3/MinIO
    const { key, url } = await this.s3.upload(file);

    // Extract text
    const extractedText = await this.extractor.extract(file);

    // Save record
    const doc = await this.prisma.document.create({
      data: {
        filename: file.originalname,
        fileUrl: url,
        extractedText,
      },
    });

    return doc;
  }

  async analyzeDocument(id: string) {
    const doc = await this.prisma.document.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Document not found');

    const analysis = await this.llm.analyze(doc.extractedText || '');

    const updated = await this.prisma.document.update({
      where: { id },
      data: {
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
