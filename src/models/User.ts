import mongoose, { Schema, Document } from 'mongoose'

export interface IUser extends Document {
  email: string
  password: string
  name: string
  lastname: string
  confirmed: boolean
  profileImage: string | null
}

const userSchema: Schema = new Schema({
  email : {
    type: String,
    required: true,
    lowercase: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  lastname: {
    type: String,
    required: true
  },
  confirmed: {
    type: Boolean,
    default: false
  },
  profileImage: {
    type: String,
    default: null
  }
})

const User = mongoose.model<IUser>('User', userSchema)
export default User
