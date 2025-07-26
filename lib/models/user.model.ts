import mongoose, { Schema, type Document } from "mongoose"

export interface IUser extends Document {
  clerkId: string
  email: string
  name?: string
  picture?: string
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    clerkId: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      // Removed unique constraint to prevent duplicate key errors
    },
    name: {
      type: String,
    },
    picture: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
)

const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema)

export default User
