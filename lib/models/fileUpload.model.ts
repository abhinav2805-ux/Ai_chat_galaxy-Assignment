import mongoose, { Schema, type Document } from "mongoose"

export interface IFileUpload extends Document {
  userId: mongoose.Types.ObjectId
  fileName: string
  fileUrl: string
  fileType: string
  extractedText?: string
  conversationId?: mongoose.Types.ObjectId
  processingStatus?: 'pending' | 'processing' | 'completed' | 'failed'
  createdAt: Date
  updatedAt: Date
}

const FileUploadSchema = new Schema<IFileUpload>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      required: true,
    },
    extractedText: {
      type: String,
    },
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
    },
    processingStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  },
)

const FileUpload = mongoose.models.FileUpload || mongoose.model<IFileUpload>("FileUpload", FileUploadSchema)

export default FileUpload
