# Backend Workflow: QP Gen (Deep Dive)

## 1. Request Lifecycle & Middleware
Every request to the Node.js server follows a strict pipeline to ensure security and performance.

1.  **Security Layer**: `Helmet` handles header security, while `CORS` (configured to allow ports 5173 and 5174) controls cross-origin access.
2.  **Rate Limiting**: `express-rate-limit` prevents brute-force attacks and API abuse (currently set to 120 requests per minute).
3.  **Identity Layer**:
    -   `Cookie-Parser`: Extracts JWT from the HTTP-only cookie.
    -   `requireAuth`: Verifies the token and attaches the `user` object to the request.
    -   `requireRole`: A custom middleware that checks if the user has the necessary permissions (Admin vs. Faculty) for that specific route.

---

## 2. Content Ingestion & RAG Workflow
This is how the system "learns" from syllabus and notes PDFs.

1.  **Storage**: `multer` receives the PDF and stores it in the `/uploads` directory with a unique timestamp-prefixed filename.
2.  **Integrity**: The system generates a `SHA-256` hash of the file to prevent duplicates and ensure file integrity.
3.  **Extraction**: The `extractPdfText` service parses the raw text from the PDF.
4.  **Chunking**: The raw text is broken into smaller `chunks` for better processing.
5.  **Persistence**: The extracted text, metadata, and chunk references are saved to the `Syllabus` or `Note` collections in MongoDB.

---

## 3. The AI Generation Pipeline
The core "intelligence" of the system happens in the `/api/generation/mock` route.

1.  **Context Assembly**:
    -   The system fetches the most recent **Syllabus** and **Notes** for the given `courseId`.
    -   It combines these into a "Knowledge Base" for that specific request.
2.  **Retrieval**: For every question requested, the system uses `extractContext` to find the most relevant 180-character snippet from the syllabus based on the `topic`.
3.  **Prompt Engineering**:
    -   The system maps the **Bloom's Taxonomy Level (K1-K6)** to specific pedagogical verbs (e.g., K4 -> "Analyze").
    -   It injects "Strict MCQ Format" requirements if it's a 1-mark K1 question.
4.  **Execution (Groq/Llama 3)**:
    -   The API sends the prompt to **Groq** (using `llama3-70b-8192`) for high-speed generation.
5.  **Fallback Mechanism**: If the AI service is offline or fails, the backend triggers `buildQuestionText`, which uses template-based string interpolation to generate a usable question.

---

## 4. Multi-Service PDF Rendering
Once the questions are generated, the handoff to the PDF service follows this path:

1.  **Node.js Handoff**: The frontend sends the final structured Paper JSON to the Node.js server.
2.  **Java Trigger**: Node.js forwards the request to the `pdf-service` (Java/Spring Boot) via an internal API call.
3.  **Dynamic Rendering**:
    -   `PdfRenderService.java` (using Apache PDFBox) calculates the exact bounding boxes for text.
    -   It handles multi-page logic via `ensureSpace` calculations.
    -   It renders lines, boxes (for Reg No and QP Code), and text according to the institutional template.
4.  **Response**: The Java service returns the raw byte stream as a `Blob`, which Node.js passes back to the user's browser.

---

## 5. Database Strategy
-   **MongoDB Atlas**: Used for high flexibility and easy scaling.
-   **Indexing**: Fields like `courseId`, `email`, and `uuid` are indexed to ensure fast lookups.
-   **Audit Logs**: Every major action (User verification, Paper generation) is logged in an `AuditLog` collection for NAAC compliance and tracking.
