# Project Documentation: QP Gen (Question Paper Generator)

## 1. Project Overview
**QP Gen** (Question Paper Generator) is an AI-powered system designed for educational institutions to generate professional, standard-compliant question papers. It emphasizes **NAAC/NBA compliance** and follows **Bloom's Taxonomy (BTL K1–K6)** to ensure academic rigor and balanced assessments.

---

## 2. Design System & Aesthetics
The project uses a modern, high-contrast design with a focus on "Orange" as the primary action color and "Blue" for secondary details and information.

### 🎨 Color Palette
| Category | Color | Tailwind Class | Usage |
| :--- | :--- | :--- | :--- |
| **Primary** | #F97316 | `orange-500` | Main CTA buttons, "Get Started", primary icons, active states. |
| **Secondary** | #3B82F6 | `blue-500` | Information badges, secondary buttons, "Learn More", chart bars. |
| **Danger** | #EF4444 | `red-500` | Delete actions, error messages, important alerts. |
| **Success** | #10B981 | `emerald-500` | Success notifications, approval status, save indicators. |
| **Light BG** | #FFFFFF | `white` | Page background, cards, navbar in light mode. |
| **Dark BG** | #111827 | `gray-900` | Page background in dark mode. |
| **Surface** | #1F2937 | `gray-800` | Navbar and card backgrounds in dark mode. |

### 🛠 Typography & UI Patterns
- **Fonts**: Inter / Sans-serif for clean readability.
- **Components**: Rounded corners (`rounded-md` / `rounded-lg`), subtle shadows (`shadow-md`), and smooth transitions for theme switching.
- **Themes**: Full **Dark Mode** support via Tailwind `dark:` prefix.

---

## 3. Technology Stack
- **Frontend**: React (Vite) + Tailwind CSS + React Router.
- **Backend (API)**: Node.js + Express (handles Auth, Uploads, and AI orchestration).
- **Database**: MongoDB (stores Syllabus, Templates, and generated paper metadata).
- **PDF Service**: Java (Spring Boot) + Apache PDFBox (specialized microservice for precise PDF rendering).
- **AI Integration**: Groq API / Gemini Pro (used for context-aware question generation from syllabus/notes).

---

## 4. Work Flow Design
The project follows a multi-stage lifecycle involving three main entities: **Admin**, **Faculty**, and the **AI Engine**.

### Phase 1: Preparation (Admin)
1. **Syllabus Upload**: Admin uploads syllabus/notes PDFs.
2. **Text Extraction**: The system extracts text content and chunks it for the AI.
3. **Template Creation**: Admin defines "Question Paper Templates" (JSON format) specifying sections (Part A, Part B), marks, and BTL level requirements.

### Phase 2: Generation (Faculty)
1. **Selection**: Faculty selects a Course and an approved Template.
2. **AI Generation**: Faculty requests AI to generate questions. The Node.js server sends relevant syllabus chunks and the template format to Groq/Gemini.
3. **Review**: Faculty can modify, add, or swap questions to perfect the paper.

### Phase 3: Rendering (System)
1. **Handoff**: Node.js sends the final structured paper JSON to the **Java PDF Service**.
2. **Rendering**: The Java service uses `PdfRenderService.java` to calculate coordinates and render a high-quality, perfectly aligned PDF.
3. **Download**: The user downloads the generated `.pdf` file.

---

## 5. Key Features
- **Bloom's Taxonomy Alignment**: Mandatory selection of BTL levels (K1–K6) for every question.
- **Topic Coverage**: Ensures questions are distributed across the syllabus units.
- **AI-Driven Data**: Automatically converts raw PDF syllabus text into structured exam questions.
- **Dynamic Previews**: View how the paper looks in real-time before exporting to PDF.
- **Multi-Tenant Ready**: Supports multiple institutions with custom headers and logos via MongoDB schemas.
