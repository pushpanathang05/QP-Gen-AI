import mongoose from 'mongoose'

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'faculty'], required: true, index: true },
    firstName: { type: String },
    lastName: { type: String },
    status: {
      type: String,
      enum: ['pending_email', 'pending_admin_approval', 'approved', 'suspended'],
      required: true,
      index: true,
    },
    lastLoginAt: { type: Date },
  },
  { timestamps: true },
)

export default mongoose.model('User', UserSchema)
