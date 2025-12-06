import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { S3Service } from './s3.services';
import { TextExtractService } from './text-extract.service';
import { LlmService } from './lim.services';
import { PrismaModule } from '../../prisma/prisma.module';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  imports: [PrismaModule],
  controllers: [DocumentsController],
  providers: [DocumentsService, S3Service, TextExtractService, LlmService, PrismaService],
})
export class DocumentsModule {}
