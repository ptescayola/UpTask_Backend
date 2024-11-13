import type { Request, Response } from 'express'
import User from '../models/User'
import Token from '../models/Token'
import { checkPassword, hashPassword } from '../utils/auth'
import { generateToken } from '../utils/token'
import { AuthEmail } from '../emails/AuthEmail'
import { generateJWT } from '../utils/jwt'

export class AuthController {

  static createAccount = async (req: Request, res: Response) => {
    try {
      const { password, email } = req.body

      // Prevent duplicates
      const userExists = await User.findOne({ email })
      if (userExists) {
        const error = new Error('User already exists')
        res.status(409).json({ error: error.message })
        return
      }

      // Create User
      const user = new User(req.body)

      // Hash Password
      user.password = await hashPassword(password)

      // Token
      const token = new Token()
      token.token = generateToken()
      token.user = user.id

      // Send email
      AuthEmail.sendConfirmationEmail({
        email: user.email,
        name: user.name,
        token: token.token
      })

      await Promise.allSettled([user.save(), token.save()])
      res.send('Account created, check your email to confirm it')
    } catch (error) {
      res.status(500).json({ error: 'Error' })
    }
  }

  static confirmAccount = async (req: Request, res: Response) => {
    try {
      const { token } = req.body

      const tokenExists = await Token.findOne({ token })
      if (!tokenExists) {
        const error = new Error('Token not valid')
        return res.status(404).json({ error: error.message })
      }

      const user = await User.findById(tokenExists.user)
      user.confirmed = true

      await Promise.allSettled([user.save(), tokenExists.deleteOne()])
      res.send('Account created')
    } catch (error) {
      res.status(500).json({ error: 'Error' })
    }
  }

  static login = async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body
      const user = await User.findOne({ email })
      if (!user) {
        const error = new Error('User not found')
        return res.status(404).json({ error: error.message })
      }

      if (!user.confirmed) {
        const token = new Token()
        token.user = user.id
        token.token = generateToken()
        await token.save()

        AuthEmail.sendConfirmationEmail({
          email: user.email,
          name: user.name,
          token: token.token
        })

        const error = new Error('The account has not been confirmed, we have sent a confirmation email')
        return res.status(401).json({ error: error.message })
      }

      if (!await checkPassword(password, user.password)) {
        const error = new Error('Wrong Password')
        return res.status(401).json({ error: error.message })
      }

      const token = generateJWT({id: user._id})

      res.send(token)

    } catch (error) {
      res.status(500).json({ error: 'Error' })
    }
  }

  static requestConfirmationCode = async (req: Request, res: Response) => {
    try {
      const { email } = req.body

      // User already exists
      const user = await User.findOne({ email })
      if (!user) {
        const error = new Error('User not registered')
        return res.status(404).json({ error: error.message })
      }

      // User already confirmed
      if (user.confirmed) {
        const error = new Error('User already confirmed')
        return res.status(403).json({ error: error.message })
      }

      // Generate token
      const token = new Token()
      token.token = generateToken()
      token.user = user.id

      // Send email
      AuthEmail.sendConfirmationEmail({
        email: user.email,
        name: user.name,
        token: token.token
      })

      await Promise.allSettled([user.save(), token.save()])

      res.send('A new token has been sent to your email.')
    } catch (error) {
      res.status(500).json({ error: 'Error' })
    }
  }

  static forgotPassword = async (req: Request, res: Response) => {
    try {
      const { email } = req.body

      // User already exists
      const user = await User.findOne({ email })
      if (!user) {
        const error = new Error('The user is not registered')
        return res.status(404).json({ error: error.message })
      }

      // Generate token
      const token = new Token()
      token.token = generateToken()
      token.user = user.id
      await token.save()

      // Send email
      AuthEmail.sendPasswordResetToken({
        email: user.email,
        name: user.name,
        token: token.token
      })
      res.send('Check your email for instructions')
    } catch (error) {
      res.status(500).json({ error: 'Error' })
    }
  }

  static validateToken = async (req: Request, res: Response) => {
    try {
      const { token } = req.body

      const tokenExists = await Token.findOne({ token })
      if (!tokenExists) {
        const error = new Error('Token not valid')
        return res.status(404).json({ error: error.message })
      }
      res.send('Valid token, set your new password')
    } catch (error) {
      res.status(500).json({ error: 'Error' })
    }
  }

  static updatePasswordWithToken = async (req: Request, res: Response) => {
    try {
      const { token } = req.params
      const { password } = req.body

      const tokenExists = await Token.findOne({ token })
      if (!tokenExists) {
        const error = new Error('Token not valid')
        return res.status(404).json({ error: error.message })
      }

      const user = await User.findById(tokenExists.user)
      user.password = await hashPassword(password)

      await Promise.allSettled([user.save(), tokenExists.deleteOne()])

      res.send('The password was changed successfully')
    } catch (error) {
      res.status(500).json({ error: 'Error' })
    }
  }

  static user = async (req: Request, res: Response) => {
    return res.json(req.user)
  }

  static updateProfile = async (req: Request, res: Response) => {
    const { name, email } = req.body

    const userExists = await User.findOne({email})
    if (userExists && userExists.id.toString() !== req.user.id.toString() ) {
      const error = new Error('Email already exist')
      return res.status(409).json({error: error.message})
    }

    req.user.name = name
    req.user.email = email

    try {
      await req.user.save()
      res.send('Profile updated')
    } catch (error) {
      res.status(500).send('Error')
    }
  }

  static updateCurrentUserPassword = async (req: Request, res: Response) => {
    const { current_password, password } = req.body

    const user = await User.findById(req.user.id)

    const isPasswordCorrect = await checkPassword(current_password, user.password)
    if (!isPasswordCorrect) {
      const error = new Error('Incorrect password')
      return res.status(401).json({error: error.message})
    }

    try {
      user.password = await hashPassword(password)
      await user.save()
      res.send('Pasword updated')
    } catch (error) {
      res.status(500).send('Error')
    }
  }

  static checkPassword = async (req: Request, res: Response) => {
    const { password } = req.body

    const user = await User.findById(req.user.id)

    const isPasswordCorrect = await checkPassword(password, user.password)
    if (!isPasswordCorrect) {
      const error = new Error('Incorrect password')
      return res.status(401).json({error: error.message})
    }

    res.send('Correnct password')
  }
}
