import mongoose from 'mongoose'

const TemplateSchema = new mongoose.Schema(
  {
    institutionId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },

    name: { type: String, required: true },
    description: { type: String },
    type: { type: String, enum: ['internal', 'end_sem'], required: true, index: true },

    format: { type: mongoose.Schema.Types.Mixed, required: true },

    status: { type: String, enum: ['draft', 'approved'], default: 'draft', index: true },
    isDefault: { type: Boolean, default: false, index: true },
    isActive: { type: Boolean, default: true, index: true },

    createdBy: { type: mongoose.Schema.Types.ObjectId, required: true },
    approvedBy: { type: mongoose.Schema.Types.ObjectId },
    approvedAt: { type: Date },
  },
  { timestamps: true },
)

TemplateSchema.index({ institutionId: 1, type: 1, isDefault: 1 })

export default mongoose.model('Template', TemplateSchema)
