import mongoose from 'mongoose'
import colors from 'colors'
import { exit } from 'node:process'


export const connectDB = async () => {
  try {
    const {connection} = await mongoose.connect(process.env.MONGO_URI)
    const url = `${connection.host}:${connection.port}`
    console.log(colors.magenta.bold(`MongoDB conection: ${url}`))
  } catch (error) {
    console.log(colors.red.bold('Error connecting MongoDB'))
    console.log(error.message)
    exit(1)
  }
}
