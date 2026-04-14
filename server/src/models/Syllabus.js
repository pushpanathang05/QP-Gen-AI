import mongoose from 'mongoose'

const ChunkSchema = new mongoose.Schema(
  {
    index: { type: Number, required: true },
    text: { type: String, required: true },
    startChar: { type: Number, required: true },
    endChar: { type: Number, required: true },
    embeddingStatus: {
      type: String,
      enum: ['pending', 'succeeded', 'failed'],
      default: 'pending',
    },
  },
  { _id: false },
)

const SyllabusSchema = new mongoose.Schema(
  {
    courseId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    version: { type: String, required: true },

    source: { type: String, enum: ['pdf'], default: 'pdf' },

    pdf: {
      originalFileName: { type: String, required: true },
      mimeType: { type: String, required: true },
      sizeBytes: { type: Number, required: true },
      sha256: { type: String, required: true },
      storage: {
        provider: { type: String, enum: ['local', 's3'], default: 'local' },
        path: { type: String, required: true },
        url: { type: String },
      },
      uploadedBy: { type: mongoose.Schema.Types.ObjectId, required: true },
      uploadedAt: { type: Date, required: true, default: Date.now },
    },

    extraction: {
      status: {
        type: String,
        enum: ['pending', 'processing', 'succeeded', 'failed'],
        default: 'pending',
        index: true,
      },
      pageCount: { type: Number },
      extractedText: { type: String },
      extractedAt: { type: Date },
      error: { type: String },
      chunks: { type: [ChunkSchema], default: [] },
    },

    // Optional: structured units (can be filled later by admin tooling or NLP)
    units: {
      type: [
        {
          unitNumber: Number,
          title: String,
          topics: [String],
          hours: Number,
          btlLevels: [String],
          isInternal: Boolean,
          isEndSem: Boolean,
        },
      ],
      default: [],
    },

    totalHours: { type: Number },
  },
  { timestamps: true },
)

SyllabusSchema.index({ courseId: 1, version: 1 }, { unique: true })

export default mongoose.model('Syllabus', SyllabusSchema)
