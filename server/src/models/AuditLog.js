import mongoose from 'mongoose'

const AuditLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    action: { type: String, required: true, index: true },
    resourceType: {
      type: String,
      enum: ['institution', 'course', 'syllabus', 'notes', 'template', 'paper', 'user'],
      required: true,
      index: true,
    },
    resourceId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    details: { type: mongoose.Schema.Types.Mixed },
    ipAddress: { type: String },
    userAgent: { type: String },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false },
)

AuditLogSchema.index({ resourceType: 1, timestamp: -1 })

export default mongoose.model('AuditLog', AuditLogSchema)
