# Database Schema (MongoDB)

## Collections & Models

### Users
```js
{
  _id: ObjectId,
  email: String, // unique
  password: String, // hashed
  role: 'admin' | 'faculty',
  firstName: String,
  lastName: String,
  status: 'pending_email' | 'pending_admin_approval' | 'approved' | 'suspended',
  createdAt: Date,
  updatedAt: Date,
  lastLoginAt: Date,
  profile: {
    department: String,
    employeeId: String,
    phone: String,
  }
}
```

### Institutions
```js
{
  _id: ObjectId,
  name: String,
  code: String, // unique
  address: String,
  logoUrl: String,
  headerText: String,
  footerText: String,
  createdAt: Date,
  updatedAt: Date,
}
```

### Courses
```js
{
  _id: ObjectId,
  institutionId: ObjectId,
  code: String, // e.g., CS201
  title: String,
  department: String,
  program: String, // e.g., B.Tech CSE
  semester: Number,
  credits: Number,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date,
}
```

### Syllabi
```js
{
  _id: ObjectId,
  courseId: ObjectId,
  version: String, // e.g., "2024-2025"
  source: 'pdf',
  pdf: {
    originalFileName: String,
    mimeType: String, // application/pdf
    sizeBytes: Number,
    sha256: String,
    storage: {
      provider: 'local' | 's3',
      path: String, // local path or object key
      url: String, // optional public/signed URL
    },
    uploadedBy: ObjectId,
    uploadedAt: Date,
  },
  extraction: {
    status: 'pending' | 'processing' | 'succeeded' | 'failed',
    pageCount: Number,
    extractedText: String, // raw text extracted from PDF
    extractedAt: Date,
    error: String,
    chunks: [{
      index: Number,
      text: String,
      startChar: Number,
      endChar: Number,
      embeddingStatus: 'pending' | 'succeeded' | 'failed',
    }],
  },
  units: [{
    unitNumber: Number,
    title: String,
    topics: [String],
    hours: Number,
    btlLevels: ['K1'|'K2'|'K3'|'K4'|'K5'|'K6'],
    isInternal: Boolean, // whether covered in internal exams
    isEndSem: Boolean,   // whether covered in end-semester exams
  }],
  totalHours: Number,
  createdAt: Date,
  updatedAt: Date,
}
```

### Notes
```js
{
  _id: ObjectId,
  courseId: ObjectId,
  unitNumber: Number,
  title: String,
  source: 'pdf',
  pdf: {
    originalFileName: String,
    mimeType: String, // application/pdf
    sizeBytes: Number,
    sha256: String,
    storage: {
      provider: 'local' | 's3',
      path: String, // local path or object key
      url: String, // optional public/signed URL
    },
    uploadedBy: ObjectId, // faculty
    uploadedAt: Date,
  },
  extraction: {
    status: 'pending' | 'processing' | 'succeeded' | 'failed',
    pageCount: Number,
    extractedText: String, // raw text extracted from PDF
    extractedAt: Date,
    error: String,
    chunks: [{
      index: Number,
      text: String,
      startChar: Number,
      endChar: Number,
      embeddingStatus: 'pending' | 'succeeded' | 'failed',
    }],
  },
  createdAt: Date,
  updatedAt: Date,
}
```

### Templates
```js
{
  _id: ObjectId,
  institutionId: ObjectId,
  name: String,
  description: String,
  type: 'internal' | 'end_sem',
  format: {
    header: {
      logoUrl: String,
      institutionName: String,
      examTitle: String,
      courseCode: String,
      courseTitle: String,
      semester: String,
      examDate: String,
      duration: String,
      maxMarks: String,
    },
    sections: [{
      sectionId: String,
      title: String, // e.g., "Part A"
      description: String,
      questionsCount: Number,
      marksPerQuestion: Number,
      totalMarks: Number,
      btlLevels: ['K1'|'K2'|'K3'|'K4'|'K5'|'K6'],
      compulsory: Boolean,
      chooseAny: Number, // optional: if chooseAny > 0, students can choose any N questions
    }],
    footer: {
      signatureBlocks: [{
        role: String,
        signatureLine: String,
      }],
      instructions: [String],
    },
    layout: {
      margins: { top: Number, bottom: Number, left: Number, right: Number },
      fontSize: Number,
      lineHeight: Number,
      spacing: Number,
    }
  },
  isDefault: Boolean,
  isActive: Boolean,
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date,
}
```

### QuestionPapers
```js
{
  _id: ObjectId,
  courseId: ObjectId,
  templateId: ObjectId,
  examType: 'internal' | 'end_sem',
  title: String,
  duration: String, // e.g., "3 Hours"
  maxMarks: Number,
  sections: [{
    sectionId: String,
    title: String,
    questions: [{
      questionNumber: Number,
      text: String,
      btlLevel: 'K1'|'K2'|'K3'|'K4'|'K5'|'K6',
      marks: Number,
      unitNumber: Number,
      topics: [String],
      difficulty: 'easy'|'medium'|'hard',
      choices: [String], // for MCQ if applicable
      answer: String, // for reference
      generatedBy: 'ai' | 'manual',
    }],
    totalMarks: Number,
  }],
  metadata: {
    generatedBy: ObjectId, // faculty
    generatedAt: Date,
    version: Number, // for regeneration tracking
    syllabusVersion: String,
    approvedBy: ObjectId, // admin if applicable
    approvedAt: Date,
    lockedAt: Date,
    exportedAt: Date,
  },
  status: 'draft' | 'generated' | 'approved' | 'locked' | 'exported',
  fileUrl: String, // generated PDF
  createdAt: Date,
  updatedAt: Date,
}
```

### AuditLogs
```js
{
  _id: ObjectId,
  userId: ObjectId,
  action: String, // e.g., 'course_created', 'paper_generated', 'template_approved'
  resourceType: 'course' | 'syllabus' | 'notes' | 'template' | 'paper',
  resourceId: ObjectId,
  details: Object, // additional context
  ipAddress: String,
  userAgent: String,
  timestamp: Date,
}
```

### GenerationRequests (for AI generation)
```js
{
  _id: ObjectId,
  userId: ObjectId,
  courseId: ObjectId,
  templateId: ObjectId,
  examType: 'internal' | 'end_sem',
  sections: [{
    sectionId: String,
    questionsCount: Number,
    marksPerQuestion: Number,
    btlLevels: ['K1'|'K2'|'K3'|'K4'|'K5'|'K6'],
    unitConstraints: [{ unitNumber: Number, maxQuestions: Number }],
    topicConstraints: [String],
  }],
  status: 'pending' | 'processing' | 'completed' | 'failed',
  result: {
    questionPaperId: ObjectId,
    error: String,
  },
  createdAt: Date,
  updatedAt: Date,
}
```

## Indexes

- Users: email (unique), role, status
- Courses: institutionId, code, department, isActive
- Syllabi: courseId, version
- Notes: courseId, unitNumber
- Templates: institutionId, type, isActive
- QuestionPapers: courseId, examType, status, generatedBy
- AuditLogs: userId, resourceType, timestamp

## Relationships & Constraints

- A User belongs to an Institution (via Users.institutionId)
- A Course belongs to an Institution
- A Syllabus belongs to a Course
- Notes belong to a Course and unit
- Templates belong to an Institution
- QuestionPapers belong to a Course, Template, and generated by a User
- AuditLogs are created for every significant action

## Notes

- All dates are stored in UTC
- File URLs point to cloud storage (e.g., S3) or local uploads
- Passwords are hashed using bcrypt
- BTL levels follow Bloom's Taxonomy: K1(Knowledge), K2(Comprehension), K3(Application), K4(Analysis), K5(Synthesis), K6(Evaluation)
