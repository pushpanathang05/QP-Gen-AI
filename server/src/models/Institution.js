import mongoose from 'mongoose'

const InstitutionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    address: { type: String },
    logoUrl: { type: String },
    headerText: { type: String },
    footerText: { type: String },
    isActive: { type: Boolean, default: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, required: true },
  },
  { timestamps: true },
)

export default mongoose.model('Institution', InstitutionSchema)
