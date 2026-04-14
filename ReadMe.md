
# AI-Powered College Question Paper Generator (QP Gen)

Frontend + Backend system for generating college/university question papers with NAAC/NBA-compliant formats and Bloom's Taxonomy (BTL K1–K6) controls.

## Repo Structure

- `client/` React (Vite) frontend
- `server/` Node.js/Express backend (MongoDB) + PDF upload + PDF text extraction
- `docs/` architecture notes (database schema, etc.)

## Prerequisites

- Node.js (LTS recommended)
- MongoDB running locally (or a MongoDB Atlas URI)

## Setup (Backend)

1) Create `server/.env`:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/qp_generator
PORT=5000
CORS_ORIGIN=http://localhost:5173
```

2) Install deps and run:

```bash
npm install
npm run dev
```

Backend health check:

- `GET http://localhost:5000/health`

### PDF Upload Endpoints

- `POST http://localhost:5000/api/uploads/syllabus` (multipart/form-data)
  - `pdf` (file, required)
  - `courseId` (string, required)
  - `version` (string, required)
  - `uploadedBy` (string, required for now)

- `POST http://localhost:5000/api/uploads/notes` (multipart/form-data)
  - `pdf` (file, required)
  - `courseId` (string, required)
  - `unitNumber` (number, required)
  - `title` (string, required)
  - `uploadedBy` (string, required for now)

On upload, the server:

- stores PDFs in `server/uploads/`
- extracts text from PDFs
- stores extracted text + chunks in MongoDB (for later embeddings/AI)

## Setup (Frontend)

```bash
npm install
npm run dev
```

Frontend runs on:

- `http://localhost:5173`

## Documentation

- Database schema: `docs/database-schema.md`

## Next Steps

- Add JWT auth + role-based access (admin/faculty)
- Admin UI to create courses and upload syllabus/notes PDFs
- Faculty section builder + AI generation + PDF export

