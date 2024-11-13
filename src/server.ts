import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import morgan from 'morgan'
import { corsConfig } from './config/cors'
import { connectDB } from './config/db'
import authRoutes from './routes/authRoutes'
import projectRoutes from './routes/projectRoutes'

dotenv.config()
const app = express()

app.use(cors(corsConfig))
app.use(morgan('dev'))
app.use(express.json())

connectDB()

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/projects', projectRoutes)

export default app
