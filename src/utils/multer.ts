import multer from 'multer'
import path from 'path'
import fs from 'fs'

const createUploadsDirectory = () => {
  const uploadDir = './uploads'
  const profileDir = './uploads/profiles'
  
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir)
  }
  
  if (!fs.existsSync(profileDir)) {
    fs.mkdirSync(profileDir)
  }
}

createUploadsDirectory()

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, './uploads/profiles/')
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
})

const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif']
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG and GIF images are allowed.'))
  }
}

export const uploadConfig = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
})

export const deleteProfileImage = (filename: string) => {
  const path = `./uploads/profiles/${filename}`
  if (fs.existsSync(path)) {
    fs.unlinkSync(path)
  }
}
