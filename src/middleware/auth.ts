import { Request, Response, NextFunction, RequestHandler} from 'express'
import jwt from 'jsonwebtoken'
import User, { IUser } from '../models/User'

declare global {
  namespace Express {
    interface Request {
      user?: IUser
    }
  }
}

export const authenticate: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  const bearer = req.headers.authorization
  if (!bearer) {
    const error = new Error('Not Authorized')
    res.status(401).json({error: error.message})
    return
  }

  const [, token] = bearer.split(' ')
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    if (typeof decoded === 'object' && decoded.id) {
      const user = await User.findById(decoded.id).select('_id name email')
      if (user) {
        req.user = user // to have available what user is doing request (manager)
        next()
      } else {
        res.status(500).json({error: 'Token not valid'})
      }
    }
  } catch (error) {
    res.status(500).json({error: 'Token not valid'})
  }
}
