# Doc-Summarizer

A NestJS-based service that allows users to upload PDF or DOCX documents, extract text, and summarize content using an LLM. The service also detects document types (invoice, CV, report, letter) and extracts relevant metadata (date, sender, total amount, etc.).

---

## Features

- Upload PDF/DOCX files (max 5MB)
- Store raw files in S3/MinIO
- Extract text using `pdf-parse` and `mammoth`
- Optional OCR support for scanned PDFs (Tesseract.js)
- Analyze documents with OpenRouter LLM (e.g., GPT-4o-mini)
- Returns summary, document type, and metadata
- REST API endpoints with NestJS

---

## Quickstart

### 1. Clone Repository

```bash
git clone https://github.com/Kessi-ux/Doc-summarizer.git 

cd Doc-summarizer/server
```

### 2. Set Up Environment

Create a .env file:

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/docs
S3_ENDPOINT=localhost
S3_PORT=9000
S3_ACCESS_KEY=minio
S3_SECRET_KEY=minio123
S3_BUCKET=documents
OPEN_ROUTER_API_KEY=sk-...
PORT=3000

# 3. Start Local Infrastructure
```bash
 docker compose up -d
 ```
 MinIO UI: http://localhost:9000

Username: minio / Password: minio123

Postgres: localhost:5432

### 4. Install Dependencies & Generate Prisma Client

```bash
npm install
npx prisma migrate dev --name init
npx prisma generate
```

### 5. Start Server (Development)
```bash
npm run start:dev
```

Server runs on: http://localhost:3000

6. API Endpoints
Upload Document

```bash
curl -X POST http://localhost:3000/documents/upload \
  -F "file=@/path/to/sample.pdf"
```

Analyze Document
```bash
curl -X POST http://localhost:3000/documents/<id>/analyze
```

Get Document Info
```bash
curl http://localhost:3000/documents/<id>
```

### 7. Docker Build & Run
```bash
docker compose down -v
docker compose up --build
```