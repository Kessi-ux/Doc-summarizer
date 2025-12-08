import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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
     if (file.mimetype !== 'application/pdf' && file.mimetype !== 'application/msword') {
    throw new BadRequestException('Only PDF files are allowed.');
}
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
