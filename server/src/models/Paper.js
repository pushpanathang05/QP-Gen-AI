import mongoose from 'mongoose'

const QuestionSchema = new mongoose.Schema({
    questionNumber: { type: String, required: true },
    type: { type: String },
    unit: { type: String },
    topic: { type: String },
    btlLevel: { type: String, required: true },
    marks: { type: Number, required: true },
    questionText: { type: String, required: true },
})

const SectionSchema = new mongoose.Schema({
    sectionId: { type: String, required: true },
    title: { type: String, required: true },
    instructions: { type: String },
    questions: [QuestionSchema],
})

const PaperSchema = new mongoose.Schema(
    {
        institutionId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
        courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
        templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Template', required: true },

        title: { type: String, required: true },
        examType: { type: String, enum: ['internal', 'end_sem'], required: true },

        format: { type: mongoose.Schema.Types.Mixed },

        sections: [SectionSchema],

        metadata: {
            courseCode: String,
            courseTitle: String,
            templateName: String,
        },

        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    },
    { timestamps: true },
)

PaperSchema.index({ createdAt: -1 })

export default mongoose.model('Paper', PaperSchema)
