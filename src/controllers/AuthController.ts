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
        const error = new Error('email.already_exists')
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
      res.status(200).send()
    } catch (error) {
      res.status(500).json({ error: 'something_went_wrong' })
    }
  }

  static confirmAccount = async (req: Request, res: Response) => {
    try {
      const { token } = req.body

      const tokenExists = await Token.findOne({ token })
      if (!tokenExists) {
        const error = new Error('token.invalid')
        return res.status(404).json({ error: error.message })
      }

      const user = await User.findById(tokenExists.user)
      user.confirmed = true

      await Promise.allSettled([user.save(), tokenExists.deleteOne()])
      res.send('auth.account_confirmed')
    } catch (error) {
      res.status(500).json({ error: 'something_went_wrong' })
    }
  }

  static login = async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body
      const user = await User.findOne({ email })
      if (!user) {
        const error = new Error('user.not_found')
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

        const error = new Error('auth.account_not_confirmed')
        return res.status(401).json({ error: error.message })
      }

      if (!await checkPassword(password, user.password)) {
        const error = new Error('password.wrong')
        return res.status(401).json({ error: error.message })
      }

      const token = generateJWT({id: user._id})

      res.send(token)

    } catch (error) {
      res.status(500).json({ error: 'something_went_wrong' })
    }
  }

  static requestConfirmationCode = async (req: Request, res: Response) => {
    try {
      const { email } = req.body

      const user = await User.findOne({ email })
      if (!user) {
        const error = new Error('user.not_registered')
        return res.status(404).json({ error: error.message })
      }

      if (user.confirmed) {
        const error = new Error('user.already_confirmed')
        return res.status(403).json({ error: error.message })
      }

      const token = new Token()
      token.token = generateToken()
      token.user = user.id

      AuthEmail.sendConfirmationEmail({
        email: user.email,
        name: user.name,
        token: token.token
      })

      await Promise.allSettled([user.save(), token.save()])

      res.send('auth.token_sent')
    } catch (error) {
      res.status(500).json({ error: 'something_went_wrong' })
    }
  }

  static forgotPassword = async (req: Request, res: Response) => {
    try {
      const { email } = req.body

      const user = await User.findOne({ email })
      if (!user) {
        const error = new Error('user.not_registered')
        return res.status(404).json({ error: error.message })
      }

      const token = new Token()
      token.token = generateToken()
      token.user = user.id
      await token.save()

      AuthEmail.sendPasswordResetToken({
        email: user.email,
        name: user.name,
        token: token.token
      })
      res.send('auth.check_email')
    } catch (error) {
      res.status(500).json({ error: 'something_went_wrong' })
    }
  }

  static validateToken = async (req: Request, res: Response) => {
    try {
      const { token } = req.body

      const tokenExists = await Token.findOne({ token })
      if (!tokenExists) {
        const error = new Error('token.invalid')
        return res.status(404).json({ error: error.message })
      }
    } catch (error) {
      res.status(500).json({ error: 'something_went_wrong' })
    }
  }

  static updatePasswordWithToken = async (req: Request, res: Response) => {
    try {
      const { token } = req.params
      const { password } = req.body

      const tokenExists = await Token.findOne({ token })
      if (!tokenExists) {
        const error = new Error('token.invalid')
        return res.status(404).json({ error: error.message })
      }

      const user = await User.findById(tokenExists.user)
      user.password = await hashPassword(password)

      await Promise.allSettled([user.save(), tokenExists.deleteOne()])

      res.send('password.changed')
    } catch (error) {
      res.status(500).json({ error: 'something_went_wrong' })
    }
  }

  static user = async (req: Request, res: Response) => {
    return res.json(req.user)
  }

  static updateProfile = async (req: Request, res: Response) => {
    const { name, lastname, email } = req.body

    const userExists = await User.findOne({email})
    if (userExists && userExists.id.toString() !== req.user.id.toString() ) {
      const error = new Error('email.already_exists')
      return res.status(409).json({error: error.message})
    }

    req.user.name = name
    req.user.lastname = lastname
    req.user.email = email

    try {
      await req.user.save()
      res.send('user.updated')
    } catch (error) {
      res.status(500).json({ error: 'something_went_wrong' })
    }
  }

  static updateCurrentUserPassword = async (req: Request, res: Response) => {
    const { current_password, password } = req.body

    const user = await User.findById(req.user.id)

    const isPasswordCorrect = await checkPassword(current_password, user.password)
    if (!isPasswordCorrect) {
      const error = new Error('password.wrong')
      return res.status(401).json({error: error.message})
    }

    try {
      user.password = await hashPassword(password)
      await user.save()
      res.send('password.changed')
    } catch (error) {
      res.status(500).json({ error: 'something_went_wrong' })
    }
  }

  static checkPassword = async (req: Request, res: Response) => {
    const { password } = req.body

    const user = await User.findById(req.user.id)

    const isPasswordCorrect = await checkPassword(password, user.password)
    if (!isPasswordCorrect) {
      const error = new Error('password.wrong')
      return res.status(401).json({error: error.message})
    }
    return res.status(200).send()
  }
}
