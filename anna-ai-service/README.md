# Anna University AI Question Paper Generator

This is a specialized microservice for generating **R2021 Regulation** compliant question papers for Anna University. It uses local AI models for syllabus parsing and ReportLab for professional PDF formatting.

## 🚀 Features
- **Local AI**: Uses `SentenceTransformer` for free, offline-capable syllabus analysis.
- **AU Format**: Generates Part-A (10 x 2) and Part-B (5 x 13) with official grid layouts.
- **REST API**: Simple endpoint to upload a syllabus PDF and get an exam-ready PDF.
- **Docker Ready**: Easy deployment with Docker and Docker Compose.

## 🛠️ Installation

### Local Setup
1. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
2. **Run Service**:
   ```bash
   python api_server.py
   ```
   *Note: On first run, it will download the 200MB AI model.*

### Docker Setup
```bash
docker-compose up --build
```

## 📋 API Specification

### POST `/generate-paper`
**FormData**:
- `syllabus`: (Required) Syllabus PDF file.
- `code`: (Optional) Course code (e.g., CS3451).
- `subject`: (Optional) Subject name.
- `semester`: (Optional) Semester (e.g., V Semester).

**Returns**:
- `application/pdf`: The generated Anna University Question Paper.

## 🧪 Testing
```bash
curl -X POST http://localhost:5001/generate-paper \
  -F "syllabus=@CS3451_syllabus.pdf" \
  -F "code=CS3451" -F "subject=Ethics" -F "semester=V Sem" \
  --output au-paper.pdf
```
