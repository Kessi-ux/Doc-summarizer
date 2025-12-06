import { Controller, Post, UseInterceptors, UploadedFile, Body, Param, Get, HttpCode } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentsService } from './documents.service';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly docsService: DocumentsService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  async upload(@UploadedFile() file: Express.Multer.File) {
    // file validation (type) can be expanded
    return this.docsService.uploadFile(file);
  }

  @Post(':id/analyze')
  @HttpCode(200)
  async analyze(@Param('id') id: string) {
    return this.docsService.analyzeDocument(id);
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.docsService.getDocument(id);
  }
}
