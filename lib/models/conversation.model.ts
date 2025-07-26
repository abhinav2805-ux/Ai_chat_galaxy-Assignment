import mongoose, { Schema, type Document } from "mongoose"

export interface IConversation extends Document {
  userId: mongoose.Types.ObjectId
  title?: string
  createdAt: Date
  updatedAt: Date
}

const ConversationSchema = new Schema<IConversation>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
)

const Conversation = mongoose.models.Conversation || mongoose.model<IConversation>("Conversation", ConversationSchema)

export default Conversation
