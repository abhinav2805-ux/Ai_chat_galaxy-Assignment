import mongoose, { Schema, type Document } from "mongoose"

export interface IMessage extends Document {
  conversationId: mongoose.Types.ObjectId
  content: string
  role: "user" | "assistant"
  createdAt: Date
  updatedAt: Date
}

const MessageSchema = new Schema<IMessage>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
  },
  {
    timestamps: true,
  },
)

const Message = mongoose.models.Message || mongoose.model<IMessage>("Message", MessageSchema)

export default Message
