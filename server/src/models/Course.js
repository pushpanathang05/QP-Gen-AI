import mongoose from 'mongoose'

const CourseSchema = new mongoose.Schema(
  {
    institutionId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },

    courseId: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },

    code: { type: String, required: true, uppercase: true, trim: true },
    title: { type: String, required: true },
    department: { type: String },
    program: { type: String },
    semester: { type: Number },
    credits: { type: Number },

    isActive: { type: Boolean, default: true, index: true },

    createdBy: { type: mongoose.Schema.Types.ObjectId, required: true },
  },
  { timestamps: true },
)

CourseSchema.index({ institutionId: 1, code: 1 }, { unique: true })

export default mongoose.model('Course', CourseSchema)
