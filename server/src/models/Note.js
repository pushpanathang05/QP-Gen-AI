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

const NoteSchema = new mongoose.Schema(
  {
    courseId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    unitNumber: { type: Number, required: true, index: true },
    title: { type: String, required: true },

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
  },
  { timestamps: true },
)

NoteSchema.index({ courseId: 1, unitNumber: 1, title: 1 })

export default mongoose.model('Note', NoteSchema)
