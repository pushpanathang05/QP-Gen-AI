# QP Generator Server

## Setup

1. Create `.env` in this folder:

```
MONGODB_URI=mongodb://127.0.0.1:27017/qp_generator
PORT=5000
CORS_ORIGIN=http://localhost:5173

JWT_SECRET=change-me
JWT_EXPIRES_IN=7d
AUTH_COOKIE_NAME=qp_token
AUTH_COOKIE_SECURE=false
```

2. Install dependencies:

```
npm install
```

3. Start the server:

```
npm run dev
```

## Endpoints

- `GET /health`

### Auth

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`

### Admin

- `GET /api/admin/faculty/pending`
- `POST /api/admin/faculty/:id/approve`
- `POST /api/admin/users/:id/suspend`

### Institutions (Admin)

- `GET /api/institutions`
- `POST /api/institutions`
- `GET /api/institutions/:id`
- `PUT /api/institutions/:id`
- `POST /api/institutions/:id/deactivate`

### Courses

- `GET /api/courses` (admin/faculty)
- `GET /api/courses/:id` (admin/faculty)
- `POST /api/courses` (admin)
- `PUT /api/courses/:id` (admin)
- `POST /api/courses/:id/deactivate` (admin)

### Templates

- `GET /api/templates` (admin/faculty)
- `GET /api/templates/:id` (admin/faculty)
- `POST /api/templates` (admin)
- `PUT /api/templates/:id` (admin)
- `POST /api/templates/:id/approve` (admin)
- `POST /api/templates/:id/set-default` (admin)
- `POST /api/templates/:id/deactivate` (admin)

### Audit (Admin)

- `GET /api/audit`

### Uploads (Authenticated)

- `POST /api/uploads/syllabus` (multipart/form-data)
  - fields:
    - `pdf` (file, required)
    - `courseId` (string, required)
    - `version` (string, required)
    - `uploadedBy` (optional now; will be derived from JWT when authenticated)

- `POST /api/uploads/notes` (multipart/form-data)
  - fields:
    - `pdf` (file, required)
    - `courseId` (string, required)
    - `unitNumber` (number, required)
    - `title` (string, required)
    - `uploadedBy` (optional now; will be derived from JWT when authenticated)

## What happens on upload?

- PDF is stored in `server/uploads/`
- The server extracts text using `pdf-parse`
- Extracted text is chunked and saved into MongoDB under `extraction.chunks`

## Next

- Add JWT auth + roles
- Move PDF extraction into a background worker/queue
- Store PDFs in S3 and use signed URLs
- Add embeddings + vector search
